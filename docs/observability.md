# Observability

A workflow is observable when you can understand what it is doing, and what went wrong, without modifying the code to investigate. That last clause is the entire principle. The opposite of an observable workflow is one where the only way to find out why something broke is to open the script, scatter `print()` calls through it, re-run the whole thing, read the output, and then delete the `print()` calls again. Most of us have done this. Some of us did it last week.

This is the sub-principle that gets skipped most reliably in analytical work, and for an understandable reason: analytical code is usually run by the person who wrote it, interactively, on their own machine, while they watch. When it breaks you are right there, so the instrumentation feels redundant.

That reasoning is wrong in two directions. The obvious one is that sooner or later the workflow runs somewhere you are not: a scheduled job, a colleague's laptop, a CI runner, a server. The less obvious one, and the one I would put more weight on, is that observability pays while you are still writing the thing. A pipeline that reports its row counts at every step is a pipeline where you catch the bad join on the afternoon you introduce it rather than three weeks later, and the time you spend building that in is time you were going to spend on temporary `print()` calls anyway. "My own machine" also stops being a meaningful exemption the moment you come back to the project in six months, because at that point you are as much a stranger to it as anybody else. The person who benefits most from a good log is usually the person who wrote it, just later.

It helps to be explicit that this section covers two different things that get bundled together:

- **What happened during this run?** This is logging and data validation. It is instrumentation, it happens while the code executes, and it is what you read after the fact.
- **Does this code do what I think it does?** This is testing. It happens before the run, on inputs you control, and it is about the correctness of your units rather than the behaviour of a particular execution.

Both belong here because they answer the same practical question, which is "how do I find out that something is wrong without staring at the code". But they are not the same axis, and the distinction matters when you decide where to spend your effort. In my experience, analytical projects are chronically under-instrumented and only somewhat under-tested, which is the opposite of where most advice on this topic puts the emphasis.

## Logging

### `print()` is not logging

Printing to the console feels like logging and is not, and it is worth being precise about the three things you give up.

**Levels.** A `print()` call is either there or it is not. You cannot turn the verbose diagnostics off in production and back on when you are debugging, so in practice you either delete them (losing the instrumentation) or leave them in (drowning the useful output).

**Destinations.** Console output vanishes when the terminal closes. A scheduled job that printed something helpful at 3am printed it into the void. Logging lets the same call write to the console during development and to a file, or to a log aggregator, when it runs unattended.

**Context.** Every log line arrives with a timestamp, a level, and the name of the module that emitted it, for free. Reconstructing a run from timestamped lines is a completely different experience from reconstructing it from a wall of bare strings.

In R, `message()` and `warning()` are a step up from `print()` in that they write to stderr and can be suppressed, and for a small script they are a reasonable floor. They still give you no levels and no destinations.

### Log levels, and the standard worth holding

Levels are only useful if you use them consistently, which means deciding what each one means for your project. The mapping I would suggest for an analytical pipeline:

- **DEBUG** is for you, while you are working. Intermediate shapes, the values of loop variables, the branch that was taken. Off by default in anything scheduled.
- **INFO** is the narrative of a successful run. Step boundaries, input paths, row counts, the parameters the run was called with.
- **WARNING** is something unexpected that did not stop the run and that a human should look at. Three percent of rows dropped for missing income. A category in the raw data that the recode map did not know about.
- **ERROR** is a step that failed.
- **CRITICAL** is the pipeline cannot continue.

There is a standard here worth stating as plainly as the one in the modularity section about scripts reading like a table of contents: **if you read only the INFO lines, you should be able to reconstruct what the run did.** Which files it read, how many rows came in, which parameters were set, which steps ran, what came out. If your INFO log does not tell that story, it is decoration.

### R: `logger`

The [`logger` package](https://daroczig.github.io/logger/) is the current answer in R. It is lightweight, has no heavy dependencies, and uses glue-style interpolation, which makes log lines pleasant to write.

```r
library(logger)

log_threshold(INFO)
log_appender(appender_tee("logs/pipeline.log"))

survey <- readr::read_parquet(input_path)
log_info("Read {nrow(survey)} rows and {ncol(survey)} columns from {input_path}")

dropped <- sum(is.na(survey$income))
if (dropped > 0) {
  log_warn("Dropping {dropped} rows ({round(100 * dropped / nrow(survey), 1)}%) with missing income")
}
```

`log_threshold()` sets the minimum level that gets emitted, so flipping a single line at the top of your entry script switches the whole pipeline between quiet and verbose. `appender_tee()` writes to both the console and a file at once, which is usually what you want. The available levels are `TRACE`, `DEBUG`, `INFO`, `SUCCESS`, `WARN`, `ERROR`, and `FATAL`, and if you want machine-readable output, `log_layout(layout_json())` gives you one JSON object per line.

You will still find `futile.logger` in older codebases. It works, but `logger` is the one I would start a new project with.

### Python: `logging`

Python has logging in the standard library, which means no dependency and no argument about which package to use. It also has a configuration model that is genuinely off-putting the first time you meet it. Two idioms get you past most of the friction.

**Get a module-level logger by name, in every module:**

```python
# src/my_project/cleaning.py
import logging

logger = logging.getLogger(__name__)


def clean_income(df):
    logger.debug("Cleaning income on %s rows", len(df))
    ...
```

**Configure exactly once, in your entry point, and nowhere else:**

```python
# src/my_project/main.py
import logging
from pathlib import Path

def setup_logging(level: str = "INFO") -> None:
    Path("logs").mkdir(exist_ok=True)
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler("logs/pipeline.log"),
        ],
    )
```

Using `getLogger(__name__)` means every line is tagged with the module that produced it, so you can raise or lower verbosity per module rather than globally. Configuring only in the entry point is the rule that actually matters: a library module that calls `basicConfig()` will fight with whatever the caller wanted, and this is the single most common way Python logging setups go wrong.

The `logger.info("Read %s rows", n)` style with `%s` placeholders rather than an f-string is the convention, because the formatting is deferred until the message is actually emitted. For analytical code the performance difference is irrelevant, but structured handlers can capture the arguments separately, which is worth having if you ever move to JSON logs.

### What not to log

Three things, and the first two are non-negotiable.

**No secrets.** This is the same commitment made in the [portability section](./portability.md#secrets-and-paths), and log files are the most common way it gets broken by accident. A log line that helpfully echoes the connection string it just used has put a password in a plain text file that is probably not in your `.gitignore`.

**No personal data.** A log file is a data export that nobody reviewed and nobody governed. Log the row count, log the number of records failing a check, log an anonymous identifier if you must, but do not log the row.

**No whole objects.** Logging a data frame is a way of turning a useful log into an unreadable one. Log its shape, and if you need to know it was the same data next time, log a hash of it, using the approach in the [traceability section](./traceability.md#data-hashing).

::: info
**_Logs and runtime metadata are cousins, not the same thing_**

The [runtime metadata practice](./traceability.md#metadata-capture-at-runtime) covered earlier and the logs described here overlap enough to be worth separating deliberately.

A metadata sidecar is a **structured record of the conditions of a run**, written once, for a reader who is asking later "what produced this output". It is small, it is queryable, and it lives next to the artifact it describes.

A log is the **narrative of the run as it happened**, written continuously, for a reader who is asking "where did this go wrong". It is long, it is chronological, and it lives in a log directory that you rotate and eventually delete.

You want both, and they answer different questions. If you find your metadata file growing into a chronological event list, you are writing logs into the wrong file. If you find yourself grepping logs to work out which data version produced a table, you needed metadata.
:::

## Validating data at the boundaries

Logging tells you what the pipeline did. It does not tell you whether what it did was right. That is the job of assertions, and in analytical work I would argue this is the highest-return instrumentation you can add.

### The failures that do not raise

Here is the thing that makes analytical code different from most software. Our expensive failures are usually not exceptions. They are **silent successes**.

A merge key gained trailing whitespace in this year's extract, so a join that should have matched every row matched none, and your treatment indicator is all zeros. A new response category appeared in the raw data, fell through your recode, and became `NA`. A column that was numeric last quarter arrives as character, so a filter matches nothing rather than everything. A join fanned out because the lookup table gained duplicates, and now your sample size is 40% larger than the paper says it is.

None of these throw an error. All of them produce a number. And every one of them is undetectable by looking at the code, because the code is fine. The data changed.

This is why data validation is not a subset of testing. Tests protect you from your own logic. Assertions protect you from the world.

### Joins, specifically

If you only add assertions in one place, add them around joins. Both languages have this built in and both features are badly underused.

In R, `dplyr` joins take a `relationship` argument that errors when the cardinality is not what you declared:

```r
survey <- survey |>
  dplyr::left_join(region_lookup, by = "district", relationship = "many-to-one")
```

If `region_lookup` ever gains a duplicate `district`, this fails immediately instead of quietly multiplying your rows.

In `pandas`, the same idea lives in the `validate` argument:

```python
survey = survey.merge(region_lookup, on="district", how="left", validate="many_to_one")
```

Declaring the relationship you expect costs you one argument and converts a silent corruption into a loud failure. There is no reason not to write it every single time.

### Assertions you can write today

Before reaching for any package, the base tools are already useful. In R:

```r
stopifnot(
  nrow(survey) > 0,
  !any(duplicated(survey$respondent_id)),
  all(survey$age >= 18 & survey$age <= 120)
)
```

In Python, a bare `assert` in analysis code works, with the caveat that assertions are stripped when the interpreter runs with `-O`, so for checks you actually depend on, raise instead:

```python
if survey.empty:
    raise ValueError("Survey is empty after filtering, check the year argument")
```

For validating function arguments rather than data, R's [`checkmate`](https://mllg.github.io/checkmate/) is worth adopting as a habit. It is fast and its error messages are far more informative than a hand-written `stopifnot`:

```r
clean_income <- function(df, threshold = 0.99) {
  checkmate::assert_data_frame(df, min.rows = 1)
  checkmate::assert_number(threshold, lower = 0, upper = 1)
  ...
}
```

Python's equivalent for this is type hints plus, where the input is structured configuration rather than a data frame, [`pydantic`](https://docs.pydantic.dev/).

### Schema validation as a tool

Once the checks accumulate, it is worth declaring them in one place rather than scattering them through the pipeline.

In R, [`assertr`](https://docs.ropensci.org/assertr/) fits naturally into a pipe, which makes it the low-friction option:

```r
library(assertr)

survey <- raw_survey |>
  verify(nrow(.) > 0) |>
  assert(not_na, country, year, respondent_id) |>
  assert(within_bounds(18, 120), age) |>
  assert(in_set(c("urban", "rural")), area)
```

[`pointblank`](https://rstudio.github.io/pointblank/) is the heavier option and earns its weight when you want a report rather than a failure. You build an agent, interrogate the table, and get an HTML summary of which checks passed, which failed, and by how much. That is genuinely useful for data you receive from someone else on a recurring basis:

```r
agent <- pointblank::create_agent(tbl = raw_survey, tbl_name = "survey_2024") |>
  pointblank::col_vals_not_null(columns = c(country, year)) |>
  pointblank::col_vals_between(columns = age, left = 18, right = 120) |>
  pointblank::rows_distinct(columns = respondent_id) |>
  pointblank::interrogate()
```

In Python, [`pandera`](https://pandera.readthedocs.io/) is the closest analogue and the one I would reach for. A schema is a declarative object you can validate against, reuse, and version alongside the code:

```python
import pandera as pa

survey_schema = pa.DataFrameSchema({
    "respondent_id": pa.Column(str, unique=True),
    "country": pa.Column(str, nullable=False),
    "year": pa.Column(int, pa.Check.isin([2020, 2022, 2024])),
    "age": pa.Column(int, pa.Check.in_range(18, 120)),
    "income": pa.Column(float, pa.Check.ge(0), nullable=True),
})

survey = survey_schema.validate(raw_survey, lazy=True)
```

The `lazy=True` argument is the part that matters in practice: it collects every failure and reports them together, rather than stopping at the first one, which turns a frustrating sequence of one-error-at-a-time runs into a single readable report. `pandera` also has a class-based interface through `DataFrameModel` if you prefer schemas that read like type declarations, and decorators (`@pa.check_input`, `@pa.check_output`) that attach validation to a function's boundaries.

You will also come across [Great Expectations](https://greatexpectations.io/). It is a capable tool and it is aimed at a different layer than this guide: suite management, data docs, and profiling of production data assets. That is data infrastructure work, which the [introduction](./introduction.md#what-do-we-mean-by-data-and-analytical-workflows) put explicitly out of scope. For an analytical project, a schema check at ingestion plus cardinality assertions around joins covers the overwhelming majority of what it would catch, at a fraction of the setup.

## Failing well

A brief but important companion to all of the above.

There is a pattern that appears in almost every analytical codebase I have worked on: a loop over countries, or waves, or model specifications, wrapped in error handling so that one failure does not kill the whole run. The intention is good. The implementation is usually this:

```r
# Do not do this
results <- purrr::map(countries, function(cty) {
  tryCatch(fit_model(cty), error = function(e) NULL)
})
```

Country 34 fails, returns `NULL`, gets dropped downstream, and nothing anywhere records that it happened. Six weeks later somebody notices the panel has 49 countries instead of 50.

Catching an error and discarding it is worse than not catching it, because a crash is at least honest. If you are going to continue past a failure, the failure has to leave a trace:

```r
results <- purrr::map(countries, function(cty) {
  tryCatch(
    fit_model(cty),
    error = function(e) {
      logger::log_error("Model failed for {cty}: {conditionMessage(e)}")
      NULL
    }
  )
})

failed <- countries[purrr::map_lgl(results, is.null)]
if (length(failed) > 0) {
  logger::log_warn("Model failed for {length(failed)} of {length(countries)} countries: {paste(failed, collapse = ', ')}")
}
```

The same applies to Python's `except`. A bare `except: pass` is a decision to be surprised later. If you re-raise, use `raise ... from e` so the original traceback survives.

The other half of failing well is the quality of your error messages, which is really a readability concern that happens at runtime. "Error in `[.data.frame`: undefined columns selected" tells the reader nothing. R's [`cli`](https://cli.r-lib.org/) package (`cli::cli_abort()`) and `rlang::abort()` make it easy to write errors that name the function, the offending value, and what was expected instead. In Python, a custom exception class with a message that includes the actual value costs two lines and saves the next person twenty minutes.

## Testing

Now the other axis. Everything above is about a particular run. Testing is about the code, checked before any run happens.

### What can you actually test in an analysis?

The honest reason analysts do not write tests is not laziness. It is that the central output of an analysis is not testable. You cannot write a test asserting that your coefficient is correct, because if you knew the right answer you would not be running the regression. The standard testing advice was written for software where the correct output is known in advance, and a good deal of analytical work is not that.

But plenty of an analytical codebase is exactly that, and it is a specific, recognizable subset:

**Deterministic transformations.** A recode, a date parser, a winsorizer, a wide-to-long reshape, an index constructor. Given this input, this output, and you know the answer because you can work it out by hand on five rows.

**Edge cases you have already hit.** Empty input. A column that is entirely `NA`. A single group. A group with one observation, which is the one that breaks standard errors. A string with an accent in it, which is the one that breaks on somebody else's locale.

**Invariants of your own functions.** The output has the same number of rows as the input. The weights sum to one. The index falls between zero and one. These are testable without knowing the substantive answer.

**Output shape and formatting.** Especially table functions. You do not care what the numbers are, you care that the columns did not silently reorder and the significance stars did not disappear.

Notice what these have in common: they are all things you have factored into a function. Which is the first honest thing to say about testing in analytical work, and it connects directly back to the [previous section](./modularity.md#the-unit-one-function-one-job): **you can only test what you have decomposed.** A three-hundred-line script has no testable surface at all. Testing is the discipline that pays modularity back, and it is one more entry in the argument for [packaging your code](./modularity.md#package-your-code), since both `testthat` and `pytest` assume a project structure rather than a folder of scripts.

### `testthat` in R

If your project is a package, `testthat` is already the expected home for tests. Set it up once:

```r
usethis::use_testthat()
usethis::use_test("clean_income")
```

A test is a description and a set of expectations:

```r
# tests/testthat/test-clean_income.R

test_that("clean_income drops non-numeric entries", {
  input  <- data.frame(income = c("1200", "not reported", "3400"))
  result <- clean_income(input)

  expect_equal(nrow(result), 2)
  expect_type(result$income, "double")
})

test_that("clean_income handles an all-missing column without erroring", {
  input <- data.frame(income = c(NA_character_, NA_character_))
  expect_equal(nrow(clean_income(input)), 0)
})
```

Run the suite with `devtools::test()`, or `testthat::test_local()` if you prefer.

The feature worth knowing about specifically for analytical work is `expect_snapshot()`. Instead of writing out the expected value, you record the output once, `testthat` stores it, and the test fails if it ever changes. For a formatted table or a printed model summary, where writing the expectation by hand would be absurd, this is exactly the right tool. The failure message shows you a diff and asks whether the change was intentional.

### `pytest` in Python

`pytest` needs no setup beyond the dev dependency (`uv add --dev pytest`, which the [Python workflow section](./python_reproducible_workflow.md) already put in place) and a `tests/` directory. A test is a plain function whose name starts with `test_`, and the assertion is a plain `assert`:

```python
# tests/test_cleaning.py
import pandas as pd
from my_project.cleaning import clean_income


def test_clean_income_drops_non_numeric():
    df = pd.DataFrame({"income": ["1200", "not reported", "3400"]})
    result = clean_income(df)

    assert len(result) == 2
    assert result["income"].dtype == "float64"
```

Run it with `uv run pytest`.

Two features carry most of the value. `@pytest.mark.parametrize` lets one test function cover a table of cases, which is how you cheaply document every input shape you have thought about:

```python
import pytest


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("1200", 1200.0),
        ("1,200", 1200.0),
        ("not reported", None),
        ("", None),
    ],
)
def test_parse_income_variants(raw, expected):
    assert parse_income(raw) == expected
```

And fixtures give shared setup a name, so the small data frame you built for one test is reusable across the file without copy-paste.

### Fixtures, not real data

The most common thing that kills a testing habit in an analytical project is writing tests that read the real data. A test that pulls a 2GB Parquet file off SharePoint is not a test, it is a pipeline run: it is slow, it needs credentials, it fails on somebody else's machine for reasons unrelated to the code, and it will not run in CI at all.

Build the smallest data frame that exercises the logic, by hand, in the test file. Five rows. Three columns. If the function needs a specific pathology, put the pathology in and nothing else. Tests should run in seconds, because a suite that takes four minutes is a suite you stop running.

If you genuinely need a file on disk, commit a tiny synthetic sample under `tests/` and keep it under a few kilobytes.

### Every bug becomes a test

Everything above still requires you to imagine what could go wrong, which is a hard thing to do on demand. Here is the version of the habit that requires no imagination at all and is, in my view, the entire practical case for testing in analytical work: **Every bug you find becomes a test.**

Something produced a wrong number. You tracked it down, you understood it, you fixed it. That understanding is the most valuable thing you will produce that day, and right now it exists only in your head. Writing it down as a test takes five minutes while the context is still loaded, and it means the bug cannot come back silently. It also means the test suite grows in exactly the places your code has actually proven to be fragile, rather than in the places you guessed it might be.

I should be honest about my own record here, because it would be easy to write this section as though I had it figured out. Of everything discussed in this guide, testing is the practice I most consistently talk myself out of. It is the thing I wish I did more often and the thing I most reliably find a reason to skip, and it is not because I doubt the argument. It is that tests are the one part of the workflow where the entire cost lands in the present and the entire benefit lands in a future I am quietly hoping not to have. So read this as a recommendation I hold in principle and honour unevenly in practice, which is a weaker endorsement than anything else in this chapter gets, and an honest one.

### Run them where you cannot forget

Tests you have to remember to run stop being run, usually within about three weeks. The fix is to attach them to something you already do, which is pushing to GitHub.

In R, `usethis` will scaffold the workflow for you:

```r
usethis::use_github_action("check-standard")
```

In Python, the workflow is short enough to write by hand:

```yaml
# .github/workflows/tests.yml
name: tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v5
      - run: uv sync
      - run: uv run pytest
```

This also closes a loop with the [traceability section](./traceability.md#version-control). Pull requests were described there as a review checkpoint, a deliberate moment of scrutiny before a change becomes part of the record. A test suite running on that pull request is what turns the checkpoint from a social convention into a mechanical one. The reviewer no longer has to notice that the recode function changed behaviour. The suite notices.

---

A closing observation about what these tools have in common. Logging, assertions, and tests are all ways of making a workflow explain itself, and all three feel like overhead at the moment you write them, because the payoff arrives later and somewhere else. That asymmetry is the same one the [introduction](./introduction.md#not-every-project-needs-everything) makes the case around, and it resolves the same way: the cost of adding them is small and front-loaded, and the cost of not having them is unbounded and arrives when you have the least time to deal with it.

The other thing they share is that each of them has a way of being done that feels native to the language and a way that does not. A Python developer's instinct for class-based schemas, a tidyverse user's instinct for assertions in a pipe, the different cultures around how much of this is expected in the first place: none of that is arbitrary, and reaching for the pattern from the wrong ecosystem produces code that is technically fine and reads as foreign. Which is the subject of the next section.
