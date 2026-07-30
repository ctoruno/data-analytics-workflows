# The Checklist

The [introduction](./introduction.md#not-every-project-needs-everything) makes a point of saying that this guide is not a checklist every project must complete in full, so opening a page called "The Checklist" requires a word of explanation.

This is not a compliance form. It is a diagnostic. The purpose is not to tick every box, it is to make sure that the boxes you leave empty are empty because you decided so, and not because the question never occurred to you. An unticked item is fine. An unticked item you cannot explain is the thing worth looking at.

The other honest caveat: I do not clear this list on every project either. The [observability section](./observability.md#every-bug-becomes-a-test) already contains my confession about testing, and it applies here too. Treat this as a description of what good practice looks like, so that when a project actually requires it, you know what to reach for.

## How to read the tiers

Items with no badge apply to essentially everything, including the fifty-line script you plan to run twice. They are cheap enough that skipping them is rarely a considered choice.

<Badge type="info" text="if it grows" /> marks the items that start to matter the moment a workflow gets a second run, a second reader, or a second dataset. Most analytical work crosses this line eventually, usually without anybody noticing on the day it happens.

<Badge type="warning" text="research" /> marks the items where the obligation is stronger because the output is a published finding, a policy input, or something that goes through peer review. For those projects, most of the list stops being optional.

---

## Is my code reproducible?

Can someone else, or you in six months, take this and arrive at the same numbers?

### Openness

- [ ] Every step of the workflow can be run with tools that do not require a licence, an institutional login, or access that only I have.
- [ ] The repository has a licence file, and any data I publish has its own licence (CC0 or CC BY unless there is a reason otherwise).
- [ ] I keep my own copy of every external input, at the exact version the workflow used, rather than trusting an API or a portal to still be there in two years.
- [ ] Where data cannot be shared, I have published something in its place: a SHA-256 hash of the inputs, a synthetic version, or documented instructions for requesting access. <Badge type="warning" text="research" />
- [ ] Published data is in an open, machine-readable format (CSV for small tables, Parquet for anything larger), not `.xlsx`.
- [ ] The version that produced the published results is archived somewhere with a DOI, not only on GitHub. <Badge type="warning" text="research" />

### Portability

- [ ] A lockfile is committed and current (`renv.lock`, `uv.lock`).
- [ ] The language version itself is declared, not just the packages.
- [ ] A collaborator can go from `git clone` to a running workflow by following steps written down in the README.
- [ ] No absolute path appears anywhere in the code. Paths are built from the project root (`here`, `pathlib`) or from an environment variable.
- [ ] No secret, key, token, or password appears in any file that is tracked by Git.
- [ ] `.Renviron` and `.env` are listed in `.gitignore`, and the README documents which variables need to exist.
- [ ] I have actually run this somewhere other than my own machine, rather than assuming it would work.

### Traceability

- [ ] Everything is in Git, and no file is named `analysis_final_v3_revised`.
- [ ] Commit messages describe intent. Someone reading the history in two years could follow what changed and why.
- [ ] For any output I have shared with someone, I can name the commit that produced it.
- [ ] Meaningful milestones are tagged (`paper-submission`, `v1.0`, `baseline-model`). <Badge type="warning" text="research" />
- [ ] I know which version of the input data produced each output, through a hash, a `pins` version, or a DVC pointer.
- [ ] Each meaningful output has a metadata record next to it: timestamp, code version, parameters, input hashes.
- [ ] Work merges through a reviewed pull request rather than landing directly on `main`. <Badge type="info" text="if it grows" />
- [ ] The whole thing runs top to bottom in a clean session, and I have verified this recently rather than assuming it.
- [ ] There is no manual step between the last line of code and the final artifact. No hand-edited table, no formatting done in Excel, no figure cropped by hand.
- [ ] Notebooks are confined to exploration. Anything that is committed has been restarted and run from the top.

---

## Is my code maintainable?

Can it be read, changed, and debugged without heroic effort?

### Readability

- [ ] Variable and function names say what the thing holds or does, without the reader having to trace back to the assignment.
- [ ] Naming conventions are consistent within the project.
- [ ] Comments explain why a line exists, not what it does. Nothing in the file restates the code above it.
- [ ] The README orients a newcomer: what this project is, how to run it, where the data lives, what has to be set up first.
- [ ] Documentation is modular rather than one enormous README. Methodology notes, data dictionaries, and codebooks live in their own files.
- [ ] There is a decision log with short dated entries recording the choices that were argued about. <Badge type="info" text="if it grows" />
- [ ] The directory structure separates raw data from processed data, scripts from notebooks, and configuration from logic.
- [ ] A formatter runs on the codebase (Air, Ruff), so that diffs reflect real changes rather than spacing habits.

### Modularity

- [ ] No piece of logic is copy-pasted into more than one place.
- [ ] I can describe what each function does without using the word "and".
- [ ] Every decision that somebody might otherwise fix by hand in the output is an argument: thresholds, labels, reference years, destination paths.
- [ ] Parameters have one home (a `params` list, a `config.py`, a YAML file), not forty literals scattered across scripts.
- [ ] Functions receive what they need as arguments rather than reading from globals.
- [ ] Any single unit can be run and checked without executing the whole pipeline.

### Observability

- [ ] The workflow reports what it is doing while it runs, and I did not have to add `print()` calls to find out.
- [ ] Logging goes through a logging library with levels, configured once at the entry point.
- [ ] Logs contain no secrets, no personal data, and no whole data frames. Shapes and hashes, not rows.
- [ ] Every join declares the cardinality it expects (`relationship =` in dplyr, `validate =` in pandas). Every single one.
- [ ] Incoming data is validated at the boundary: schema, types, ranges, uniqueness, expected categories.
- [ ] Checks I actually depend on raise real errors rather than relying on bare `assert` statements.
- [ ] Nothing catches an error and discards it. Failures inside a loop over units get recorded, counted, and reported at the end.
- [ ] Every bug I have found and fixed has a test that would catch it coming back. <Badge type="info" text="if it grows" />
- [ ] Tests run automatically on push, so that running them is not something I have to remember. <Badge type="info" text="if it grows" />

### Idiomaticity

- [ ] I have picked a dialect and stayed inside it for the length of the project, rather than mixing base R, tidyverse, and data.table in the same script for no reason.
- [ ] I am not importing one language's habits into the other: no growing a vector by concatenation in R, no iterating over rows in pandas.
- [ ] Where I depart from the ecosystem's default, I can say why, and the reason is not simply that it is how I learned it.
- [ ] When I object to something on idiomatic grounds, I can point at a cost to the next reader or to the machine, rather than to my own taste.

---

## Is my code optimal?

Are the resources it consumes, machine and human, proportionate to what it actually does?

### Efficiency

- [ ] I have measured where the time goes rather than guessing. If I am about to optimize something, I know it is the bottleneck.
- [ ] I have counted the runs honestly, including the hundreds during development, not just the scheduled ones.
- [ ] No file gets read more than once in a single run.
- [ ] Work that could be a column operation is a column operation, and where it genuinely has to be per-record, that was a decision rather than a habit.
- [ ] The session is not holding six intermediate copies of the same data frame alive for no reason.
- [ ] Types are deliberate: integers stored as integers, repeated labels stored as factors or categories rather than free text.
- [ ] Data that gets read repeatedly is stored as Parquet rather than CSV.
- [ ] Any caching in place knows when it is stale. Nothing skips a step merely because an output file already exists.
- [ ] The pipeline has been run cold, from scratch, recently enough that I would stake the published numbers on it. <Badge type="warning" text="research" />
- [ ] Before rewriting a working pipeline for performance, I checked whether renting a bigger machine for an afternoon would have been cheaper.

### Scalability

- [ ] If the number of countries, waves, or specifications doubled tomorrow, adding them would cost roughly nothing.
- [ ] Nothing that appears in a file name should have been an argument instead.
- [ ] No column is selected by position anywhere in the codebase.
- [ ] Data is shaped so that a new year means more rows rather than a schema change.
- [ ] Transformation logic accepts a table-like object rather than assuming a specific in-memory type, so that changing the engine later does not mean a rewrite.
- [ ] The workflow does not run correctly only when I run it. There is no step that lives exclusively in my head and no manual fix at the end that nobody else knows about.
- [ ] Anything exploratory that has quietly become load-bearing was promoted deliberately, and lives outside the scratch area.
- [ ] Nothing here is generalized ahead of evidence. Things that have happened once are still written directly.
