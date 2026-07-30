# Modularity

Modularity is the structural discipline that keeps readability sustainable as a project grows. If readability is about making individual lines and blocks of code clear, modularity is about making the architecture of the whole workflow comprehensible. The two reinforce each other, but only in one direction: modular code tends to be readable almost as a side effect, while a beautifully named three-hundred-line function is still a three-hundred-line function.

The practical definition is that a modular workflow decomposes logic into discrete, single-purpose units, each with a clear interface and minimal side effects. That sentence is easy to nod along to and hard to apply, so the rest of this section is about what it actually means in analytical work, and about the places where the conventional advice needs to be argued with rather than followed.

## The unit: one function, one job

The last section deliberately left out the question of how long a function should be, and this is why: length is a symptom, not the rule. A function is too long because it is doing too many things, and if you fix the second problem the first one takes care of itself. Chasing a line count directly just produces a set of small functions that are still tangled together.

The test I actually use is a naming test. **If you cannot name the function without using "and", it is doing too much.** `clean_and_merge_survey()` is a confession. So is `load_process_and_export()`. The name is telling you where the seam is, and the fix is usually to cut along it.

It is worth noting that the advice on this point is not unanimous. The mainstream recommendation for research computing, stated in Wilson et al.'s widely cited ["Good Enough Practices in Scientific Computing"](https://doi.org/10.1371/journal.pcbi.1005510), is to decompose programs into functions of no more than about sixty lines, roughly a page. That is a defensible rule and a good default for someone with no other guidance.

John Ousterhout, in [*A Philosophy of Software Design*](https://web.stanford.edu/~ouster/cgi-bin/aposd2ndEdExtract.pdf), argues close to the opposite. His unit of analysis is the module, which can be a function, a class, or a file, and his claim is that modules should be deep: a simple interface concealing a substantial implementation. The failure he warns against is the shallow module, whose interface is nearly as complicated as the thing it hides, so that the abstraction earns almost nothing while still costing the reader something to learn. He gives the habit of chopping everything into many small units a name, classitis, and argues it raises the total complexity of a system rather than lowering it, because each new interface is one more thing everyone has to hold in their head.

I find myself closer to Ousterhout, but the disagreement is a useful one to sit with rather than resolve by decree. A sixty-line function that does one job cleanly is fine. Six ten-line functions that only make sense when read together are worse, even though every one of them passes the line count.

This matters more in analytical work than in most software, because of how our functions come into existence. Nobody sits down to write `clean_and_merge_survey()`. What happens is that you write a script, the script works, you wrap it in a function so you can run it on next year's data, and the function inherits every step the script happened to contain. The origin story is the problem. A script is a sequence, a function is a unit, and wrapping the first in a signature preserves the sequence while calling it a unit. This is language-independent: an R script that grows a `function()` around it and a Python script that grows a `def` around it fail in exactly the same way.

## Interfaces: parameterize the decisions

The interface of a function is its arguments and its return value. It is the only part your collaborators actually need to understand, and designing it well is most of the job.

The rule I would offer is this: **every decision that would otherwise tempt someone to edit the output by hand should be an argument.** This is the same argument made in the [manual last mile](./traceability.md#the-manual-last-mile) section, arriving here from the other side. The table function shown there is worth looking at again with modularity in mind:

```r
main_results_table <- function(fitted_models, coef_map, stars, output_path) { ... }
```

The variable labels, the significance thresholds, the fixed effects block, the destination file. Every one of those is a thing somebody would otherwise fix by opening the `.tex` file. Once they are arguments, changing them is a code change, which means it is versioned, reviewed, and survives a rerun. A hardcoded value inside a function body is not just a maintainability problem, it is an invitation to work around the code instead of through it.

In Python the same failure tends to surface in the modelling and export steps rather than in table generation, but it is the identical mistake:

```python
# The decisions are buried
def fit_model(data):
    X_train, X_test, y_train, y_test = train_test_split(
        data, test_size=0.2, random_state=42
    )
    ...

# The decisions are declared
def fit_model(data, test_size=0.2, random_state=42):
    X_train, X_test, y_train, y_test = train_test_split(
        data, test_size=test_size, random_state=random_state
    )
    ...
```

Both versions run identically today. The difference is that the second one can be logged, swept over, and reported in the runtime metadata described in the [traceability section](./traceability.md#metadata-capture-at-runtime), while the first one requires opening the source file to find out what was actually done.

Two related habits:

**Prefer arguments to globals.** If a function needs a threshold, pass it the threshold. Reading it from a global constant works until you need two different thresholds, at which point you discover the function was never really parameterized at all.

**Give analysis parameters a single home.** Model specifications, sample cutoffs, reference years, file naming conventions: these accumulate as literals scattered across scripts, and every one of them is a number somebody will eventually need to find. What that home looks like depends on the language and on taste. In R it is often a `params` list at the top of the execution script or a small `config.R` sourced by it. In Python it might be a `config.py` module, a dataclass, or a YAML file loaded at startup. A YAML or TOML file has the advantage of being readable from both languages, which matters in mixed projects. The mechanism is negotiable, the principle is not: there should be one place to look. Note that this is a different problem from the secrets discussed in the [portability section](./portability.md#secrets-and-paths), even though both end up in files with similar names. Secrets are excluded from version control because they are sensitive. Parameters belong in version control precisely because they are decisions.

One useful diagnostic before moving on: if you cannot call a function without first spinning up a database connection and loading a two gigabyte file, that is information about the interface, not about the data. It usually means the function has bundled a decision about where data comes from together with the logic that operates on it, and those are two different jobs.

## Duplication, and the limits of DRY

Here is where I want to argue with the conventional advice, including the version of it stated in the principles chapter of this guide.

"Don't repeat yourself" is one of the first rules anybody learns, and taken literally it says that the moment you see the same lines twice, you should factor them into a function. In analytical work I think that is actively bad advice, and the reason is that the two failure modes are not symmetric.

Duplicated code is a visible problem with a cheap fix. You can see all the copies, you can read each one in isolation, and when you finally understand what they have in common you can factor them out with confidence. The wrong abstraction is an invisible problem with an expensive fix. Somebody wrote a function that unified two things that were only superficially similar, and every subsequent difference between those two things got handled by adding a parameter. Now the function has six boolean flags, three of its arguments only apply in some cases, and nobody can change it without checking every call site. [Sandi Metz](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction) gave this its canonical formulation in a talk that provoked enough reaction that she later wrote it up as an essay:

> prefer duplication over the wrong abstraction

Her account of how projects get there is worth reading in full, because the mechanism is recognizable. Someone extracts a shared abstraction. Time passes. A new requirement arrives for which the abstraction is almost right, and the next person, feeling obliged to preserve it, adds a parameter and a conditional. Then another. The code ends up as a condition-laden procedure holding several loosely related ideas together, and every new feature makes the next one harder.

The trap she identifies is the sunk cost fallacy. Existing code argues for its own necessity simply by existing, and the more incomprehensible it has become, the more effort it evidently took, and the more reluctant everyone is to throw it away. Her prescription is the part people usually miss: when an abstraction has gone wrong, inline it back into every caller, strip each copy down to what that caller actually needs, and let the duplication show you what the right abstraction would have been. Going backwards is the fast route forwards.

The practical resolution is the one you have probably heard: **when you have written the same code three times, write a function.** The number is not magic, but the logic behind it is sound. One occurrence is a thing. Two occurrences might be a coincidence, and you still do not know which parts are essential and which are incidental. Three occurrences give you actual evidence about what the shared logic is, because you have seen it vary. You are abstracting from data rather than from a guess about the future.

## Functions and classes

Both functions and classes are tools for drawing boundaries, which makes the choice between them a modularity decision rather than a stylistic one. They draw those boundaries differently, and understanding the difference is more useful than adopting a rule about which to prefer.

### Why functions are the default

Most analytical work is a transformation. Data comes in, something happens to it, data comes out, and the interesting artifact is the data rather than the machinery that produced it. A function maps onto that shape almost perfectly, which is why it is the right default and why the guide has assumed it up to this point.

The specific properties that make functions good modular units:

**They are stateless.** The output depends on the arguments and nothing else. That is what makes a function readable in isolation, which in turn is what makes a pipeline of functions readable as a sequence. You can hold one step in your head without holding the other six.

**They compose.** A pipeline of functions can be read, reordered, and recombined, whether through R's `|>` or through straightforward chaining in Python. Steps that take data and return data snap together in any order that makes sense.

**They are cheap.** There is no instantiation, no lifecycle, no question about which object owns what. Adding a step to a pipeline of functions costs one line.

For the majority of analytical work, this is the whole story, and adding structure beyond it makes things worse rather than better.

### Where functions start to strain

There are a few recognizable signals that the function-only approach is fighting you. None of them is decisive on its own, but they are worth knowing by sight.

**The same arguments travel everywhere.** When every function in a module takes the same three or four parameters, those parameters are not really arguments. They are shared context that you are threading through by hand:

```python
def load_wave(path, schema, year, connection): ...
def clean_wave(df, schema, year, connection): ...
def export_wave(df, path, schema, year, connection): ...
```

Each signature is honest, and collectively they are noise. Something in that repetition wants to be an object.

**There is a lifecycle.** Database connections, API sessions, authenticated clients, and temporary resources all need to be set up, used several times, and torn down. Functions can do this, but every call site ends up responsible for remembering the order.

**There are invariants between calls.** A fitted model must be fit before it can predict. A validated dataset must be validated before it is exported. When correctness depends on the order of operations, an object can enforce what a set of loose functions can only document.

**You have a family of things that must do the same steps differently.** This is the one I run into most often in practice, and it is the case worth working through in full.

### What a class buys you

Say you ingest survey data from four sources. Each arrives in a different file format with different column names and its own quirks, and each needs to end up in the same schema, validated the same way, and exported the same way. The wrangling differs. Everything around the wrangling is identical.

Written as functions, this becomes four near-identical scripts. They start out consistent, and within a year they have drifted, because a fix applied to one never quite makes it to the other three. The commonality is real but nothing in the code expresses it, so nothing protects it.

An abstract base class expresses it directly:

```python
from abc import ABC, abstractmethod
import pandas as pd


class SurveySource(ABC):
    def __init__(self, path: str, year: int):
        self.path = path
        self.year = year

    @abstractmethod
    def read(self) -> pd.DataFrame:
        """Read the raw file. Every source does this differently."""

    @abstractmethod
    def harmonize(self, df: pd.DataFrame) -> pd.DataFrame:
        """Map source-specific columns onto the common schema."""

    def validate(self, df: pd.DataFrame) -> pd.DataFrame:
        # identical for every source, written once
        missing = set(SCHEMA) - set(df.columns)
        if missing:
            raise ValueError(f"missing columns: {sorted(missing)}")
        return df

    def run(self) -> pd.DataFrame:
        return self.validate(self.harmonize(self.read()))
```

Each source then implements only the part that is genuinely different:

```python
class LatinobarometroSource(SurveySource):
    def read(self):
        return pd.read_stata(self.path)

    def harmonize(self, df):
        return df.rename(columns={"idenpa": "country", "edad": "age"})
```

And the orchestration stops caring which source it is looking at:

```python
sources = [
    LatinobarometroSource("data/raw/latinobarometro.dta", year=2024),
    AfrobarometerSource("data/raw/afrobarometer.sav", year=2024),
]

panel = pd.concat([source.run() for source in sources])
```

Four things happened there, and each of them is a modularity gain rather than a stylistic one:

**The interface is declared rather than assumed.** `@abstractmethod` means a new source that forgets to implement `harmonize` fails immediately, at instantiation, with a clear error. The alternative is a convention documented in a README, which is enforced by nothing.

**The shared logic exists once.** `validate` and `run` are written a single time. A fix to validation reaches every source automatically, which is precisely what the four-scripts version could not promise.

**Implementations become substitutable.** The orchestrating code loops over sources without knowing or caring what any of them are. Adding a fifth source changes one list and adds one file, and touches nothing else.

**The variation is isolated and visible.** Opening `LatinobarometroSource` tells you exactly what is unusual about that source, because everything usual lives in the parent. That is a genuinely hard thing to achieve with functions alone.

### The honest cost

Classes carry state, and state is the thing that makes code hard to reason about. A function can be understood from its signature. An object can only be understood by knowing what has already been done to it. That is a real price, and it is why the default stays with functions.

Two failure modes worth naming. The first is the class that holds no state and has one method, which is a function wearing a costume, and the `__init__` plus method call is pure ceremony. The second is inheritance depth: one level of abstraction is usually clarifying, and three levels usually means finding where a method actually comes from requires reading four files. Composition, where an object holds another object rather than inheriting from it, ages better than deep hierarchies in almost every case I have run into.

<iframe width="100%" height="315" src="https://www.youtube.com/embed/o9pEzgHorH0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

The rule of thumb I would offer: **use a function when the data is the thing that persists, and a class when the process is.** A cleaning step is a function. A connection, a fitted model, or a family of ingestion routines that must stay in step with each other is usually a class.

### And in R

R has object systems too, several of them, with S3, S4, and R6 being the ones you will actually meet, so nothing above is unavailable there. The structural need is identical: a family of ingestion routines that share a shape is still a family of ingestion routines, whatever the language.

What differs is how an R practitioner usually meets it, which tends to be a list of functions with a shared signature, or a constructor that returns a list, rather than a class hierarchy. Whether that is a limitation of the language or a difference in culture is exactly the kind of question that belongs to the discussion of idiomaticity later in this chapter, along with when object-oriented design feels native, which patterns are worth knowing, and why an instinct that pays off in Python might not be a first choice in R.

## Architecture: logic, execution, and the direction of dependencies

Everything so far has been about individual units. The last piece is how they fit together, and the good news is that the workflow sections of this guide already committed to the answer.

**Logic lives in one place, execution lives in another.** In R, that is `R/` for functions and `scripts/` for the files that run them. In Python, it is `src/my_project/` for modules and a `main.py` entry point. This is not a filing convention. It is the structural expression of everything above: the logic layer holds units that take inputs and return outputs, and the execution layer is where side effects are allowed to happen, in a visible sequence, at the top level.

**A script should read like a table of contents.** If somebody opens your execution script and cannot tell what the analysis does without opening any other file, the decomposition has failed. The script names the steps. The functions implement them.

```r
# scripts/02_analysis.R
pkgload::load_all()

survey     <- read_survey(params$input_path)
matched    <- match_treatment(survey, caliper = params$caliper)
models     <- fit_specifications(matched)
main_results_table(models, coef_map = params$labels, output = "tex/main.tex")
```

The Python equivalent is the `main.py` entry point set up in the [Python workflow section](./python_reproducible_workflow.md#use-a-main-py-as-your-entry-point), and it should read the same way:

```python
# src/my_project/main.py
from my_project.ingestion import read_survey
from my_project.matching import match_treatment
from my_project.modeling import fit_specifications
from my_project.reporting import main_results_table


def main(args):
    survey = read_survey(args.input)
    matched = match_treatment(survey, caliper=args.caliper)
    models = fit_specifications(matched)
    main_results_table(models, output_path=args.output)
```

Neither file contains any logic. Both name the steps in order and delegate every one of them. Somebody who reads only this file knows what the analysis does, and somebody who needs to know how a step works knows exactly which file to open next.

**Dependencies flow one way.** Execution imports from logic, never the reverse. Notebooks import from your package, and your package never imports from a notebook, a rule already asserted in the [Python workflow section](./python_reproducible_workflow.md) and worth the justification now: the moment logic depends on something in `notebooks/`, the notebook has become production code without anyone deciding that it should be.

There is an R-specific constraint here that was flagged in the [readability section](./readability.md#project-structure) and is worth repeating in a structural context. `R/` is flat, so your modules are files rather than directories, and the boundaries between them exist only in the naming. Python's `src/` layout lets you group related modules into subpackages as a project grows. Same discipline, different mechanics, and the R version demands more from you because the file system will not enforce anything on your behalf.

## Package your code
 
This is the recommendation made back in the [R workflow section](./r_reproducible_workflow.md), deferred until now, and this is the section where it gets its actual justification. **Package your code.** In R specifically, but the Python equivalent of writing your project as an installable module with a `src/` layout is the same recommendation wearing different clothes.
 
The argument made earlier was mostly about dependency management and namespacing, which are reproducibility concerns. The modularity argument is stronger, and it is this: everything in this section is a discipline, and a package converts it into a structure. Single-purpose units, declared interfaces, logic separated from execution, dependencies flowing one way. You can achieve every one of those with a folder of scripts and enough willpower. A package means you no longer need the willpower, because the loader enforces what you would otherwise have to remember.

This is not an idiosyncratic position. [Marwick, Boettiger and Mullen](https://faculty.washington.edu/bmarwick/PDFs/Marwick-Boettiger-Mullen-2018-TAS-research-compendia.pdf) made the same case, arguing that the R package is a natural template for what they call a research compendium: a standard, recognizable way of organizing a project's files so that someone else can inspect, reproduce, and extend the work. Their argument for it is partly that you stop having to invent a layout at all, since the package gives you

> conventions that save you time thinking about the best way to organize your project

Their three defining principles for a compendium will sound familiar by now, because this guide has arrived at them from other directions: organize files according to the conventions of your community, keep a clear separation between data, method, and output while making the relationships between them explicit, and specify the computational environment the analysis ran in. They treat raw data as read-only and outputs as disposable, on the reasoning that anything the code produced can be produced again.

Two things about their paper are worth flagging. The first is that they are explicit that the principles generalize beyond R, and that researchers working in other languages can take the structure without the tooling. The second is that they do not recommend CRAN for compendia, since its directory rules and size limits fit software rather than research projects, which is a nice illustration of the point that the package structure is useful here for organizational reasons rather than distribution ones. Their [rrtools](https://github.com/benmarwick/rrtools) package scaffolds a compendium if you want a concrete starting point.
 
Concretely, here is what stops being your problem.
 
**The public interface becomes real.** In an R package you decide what to export with `@export`, and everything else is internal. In Python, what a module exposes is a deliberate choice rather than an accident of which names happen to be defined. This is the "clear interface" from the definition of modularity, made machine-checkable instead of notional. A folder of scripts has no such distinction: every object is equally public, which means every object is equally something a collaborator might depend on.
 
**Loading becomes atomic.** `pkgload::load_all()` in R, or an import of an installed module in Python, brings the whole logic layer in as a unit. Compare that with a script that opens with a stack of `source("R/utils.R")` calls, where load order matters, where sourcing the same file twice is possible, and where a function defined in two places silently resolves to whichever was sourced last. That entire category of bug disappears, and it disappears without anyone having to be careful.
 
**Dependencies get declared.** `DESCRIPTION` in R and `pyproject.toml` in Python force you to say what your code needs. A folder of scripts declares nothing, so the answer to "what does this project depend on" is whatever happens to be attached to the session of the person who last ran it successfully.
 
**The one-way dependency rule becomes structural.** Above I said that execution imports from logic and never the reverse. In a package that is not advice, it is mechanics: `R/` cannot reach into `scripts/`, and your installed module cannot import from `notebooks/`. The rule you would otherwise have to enforce in code review is enforced by the loader, for free, every time.
 
**Documentation gets a home.** roxygen blocks generate `man/` pages, docstrings are discoverable through the normal Python tooling, and both live next to the function they describe rather than in a separate document that drifts.
 
The usual objection is that this is overkill for a one-off analysis, and I am not going to pretend that objection is always wrong. Sometimes it genuinely is overkill. So let me put this as a habit rather than a rule: package by default, and understand that every time you skip it you are placing a bet on the project staying small.
 
In my experience that bet loses more often than it wins. There have been many occasions where I looked at what was obviously a simple analysis, decided it did not deserve the ceremony of a package, and then watched the thing grow in a direction nobody had anticipated. A second data source appears. Somebody asks whether the same analysis can be run for another country. A one-off becomes a quarterly update. By the time the structure was clearly necessary, putting it in place meant reorganizing code that already worked, which is both the most expensive and the most demoralizing kind of work there is. This is the asymmetry the [introduction](./introduction.md#not-every-project-needs-everything) makes the case for, and packaging is the clearest example of it I know.
 
What makes the habit cheap is that the cost is front-loaded and small. `usethis::create_package()` in R, `uv init --lib` in Python, and the scaffolding exists. Everything after that arrives gradually, because you are expanding the project gradually: one more function documented as you write it, one more line in `DESCRIPTION` or `pyproject.toml` as you add a dependency. Those increments are marginal precisely because they are spread across the life of the project rather than paid as a lump sum at the end. And as noted in the [readability section](./readability.md#documenting-the-code-itself), the part of this that used to be genuinely tedious, documenting every function, is the exact task modern AI tools handle well, provided the code is clean enough to be read. Which is one more argument for everything else in this section.
 
Two honest notes. The first is that the leap is smaller in Python than it looks, because modules are already a first-class language feature there, so the `src/` layout is mostly a decision about installability rather than a new way of organizing anything. In R the leap feels bigger, which is precisely why the payoff is bigger too: the thing a package replaces is `source()` calls scattered across a project, and that is a genuinely worse baseline.
 
The second is that `scripts/` sits outside the package proper, and that is intentional rather than a compromise. The package is the logic layer. The execution layer sits beside it, imports from it, and is not part of what gets installed. That separation is the architecture described above, expressed as a directory layout.
