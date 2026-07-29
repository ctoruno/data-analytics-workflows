# Readability
 
Readability is the most immediate form of maintainability. Code is readable when its intent is clear without requiring the reader to reconstruct the author's thought process. That is a low bar to state and a surprisingly high one to meet, because the person who wrote the code is the worst possible judge of whether it reads well. You already know why the filter is there. You already know what the threshold means. The reader does not, and six months from now, neither will you.
 
This section covers the things that make that difference: how you name things, how you lay out the project, how you document it, when to comment, and how much of this to hand over to tooling.
 
## Naming things
 
There is no objectively correct naming convention, and arguing about casing is one of the least productive ways a team can spend an afternoon. What actually matters is consistency. A codebase that uses `snake_case` throughout is readable. A codebase that mixes `snake_case`, `camelCase`, and `dot.case` depending on which script you open forces the reader to hold three conventions in their head at once, and that cost is real even if each individual choice was defensible.
 
A few conventions worth adopting deliberately:
 
**Objects are nouns, functions are verbs.** `survey_data` holds something. `clean_survey_data()` does something. This sounds trivially obvious and is routinely ignored.
 
**Names should carry meaning, not position.** `df`, `df2`, `df_final`, `df_final_v2` tell you nothing about what the object contains, and the numbering encodes the order you happened to write things in rather than what they are. `raw_survey`, `survey_clean`, `survey_matched` costs nothing extra to type and saves the reader a trip to the top of the file.
 
**File names should read like a table of contents.** If someone lists your project directory and cannot form a rough mental model of what the code does, the names are not doing their job. Numeric prefixes help where execution order matters (`01_ingest.R`, `02_clean.R`, `03_model.R`), and they are especially useful in notebook directories where nothing else communicates sequence.
 
For both R and Python, `snake_case` is a safe default that will not surprise anyone. Python has PEP 8 behind it. R does not have a single settled authority, but the tidyverse convention has enough gravity that `snake_case` reads as normal to most people, and it avoids the mess of base R, which is internally inconsistent enough to be a poor model.
 
## Project structure
 
A well-organized directory communicates the shape of a project before a single line of code is read. Folders should have clear, consistent names, raw data should be separated from processed data, scripts should be separated from notebooks, and configuration should be separated from logic. A messy file system is the equivalent of messy code: it makes everything harder, and it makes it harder in a way that is immediately visible to anyone who opens the repository.
 
The specific layout, though, is largely determined by a decision you already made back in the reproducibility section: whether or not you package your code.
 
### If you packaged your code (and in R, you should)
 
As I argued in the [R workflow section](./r_reproducible_workflow.md), the recommendation is to always package your R code. Most of the argument there was about dependency management and namespacing, but there is a readability argument that is at least as strong: the package structure makes the layout question mostly disappear. `R/` holds the logic, `scripts/` holds the execution, `man/` holds the documentation, `data-raw/` holds the raw data preparation. Anyone who has ever opened an R package knows where to look, and you never have to defend your folder choices because they are not yours.
 
There is one constraint in R worth knowing about before it annoys you: **`R/` is flat**. R does not load code from subdirectories inside `R/`, so you cannot organize your functions into nested folders the way you might expect. That means file naming carries the entire organizational burden. A package with `R/utils.R`, `R/helpers.R`, and `R/misc.R` is telling you nothing. A package with `R/ingest_survey.R`, `R/clean_income.R`, `R/fit_models.R`, and `R/tabs.R` is telling you almost everything.
 
Python does not have this constraint. The `src/` layout described in the [Python workflow section](./python_reproducible_workflow.md) lets you nest modules into subpackages as the project grows, so a large project can group related code into directories rather than relying on file names alone. Same principle, genuinely different mechanics, and it is worth not importing the habits of one into the other.
 
### If you did not
 
Plenty of projects do not need packaging, and that is a legitimate call. If you go that route, the structure has to be created deliberately rather than inherited, and the separations worth enforcing are the same ones a package gives you for free:
 
```
project/
├── data/               # only if the data lives locally at all
│   ├── raw/            # never modified, never overwritten
│   └── processed/      # everything here is regenerable
├── src/                # functions and logic
├── scripts/            # execution, top to bottom
├── notebooks/          # exploration only
├── notes/              # documentation (see below)
├── outputs/            # tables, figures, models
└── README.md
```
 
There are two things worth saying about the `data/` folder. The first is that the split between `data/raw/` and `data/processed/` matters: raw data is an input you did not create and cannot recreate, processed data is an output of your own code, and treating them as the same kind of object is how people end up overwriting the only copy of something.
 
The second is that after enough years of doing this, one of the most reliable comforts is realizing you do not need a `data/` directory at all. Modern data is very often too big to sit on a laptop, and in most institutional settings it already lives somewhere else: a data lake, an organizational repository, a SharePoint library, an S3 bucket. If your inputs are pulled from a versioned source at runtime rather than copied into the project, the folder does not need to exist, and the question of where the data lives moves out of your directory structure and into your documentation, which is where it belongs anyway. The storage side of this is covered in [where to publish your data](./openness.md#where-to-publish-your-data), and the institutional case in [working with SharePoint](./portability.md#working-with-sharepoint).
 
## Documentation
 
Readability does not stop at the code. A workflow needs clear, in-depth, and up-to-date documentation around it: a README, methodology notes, data dictionaries, codebooks, and metadata. This is the part of maintainability that people skip most often, usually because it feels like work that produces nothing, and it is the part that costs the most when it is missing.
 
### The README
 
I will state my position plainly: **the README is the best single proxy for the quality of a project**. Before I read anyone's code, I read their README, and it tells me a great deal about the person or the team behind it. Not because a good README guarantees good code, but because the habits that produce a good README (thinking about the reader, being explicit about assumptions, keeping things current) are the same habits that produce good code.
 
What belongs in it:
 
- **What this project does**, in one paragraph, written for someone who is not on the team.
- **Status.** Is this active, frozen, or an archived replication package for a published paper? A reader should not have to guess whether they are looking at something maintained.
- **How to restore the environment.** `renv::restore()`, `uv sync`, whatever applies.
- **Which environment variables need to be set**, and what they point to. This is the promise made in the [portability section](./portability.md#secrets-and-paths) and this is where it gets kept.
- **Where the data lives** and how to get access to it.
- **How to run the thing end to end**, ideally as one command.
- **A directory map**, with one line per folder.
- **Where outputs land.**
- **Maintainer, license, and for research projects, how to cite it.**
Two things worth being deliberate about. First, a README is a **living file**. In my experience it never gets written in one sitting, and the advice to "write the README first" oversells a real insight: it grows alongside the project, and the useful discipline is updating it in the same commit as the change it describes, not front-loading it. Second, and more importantly, **a stale README is worse than a thin one**. A thin README costs the reader nothing. A README that tells them to run a script that no longer exists costs them twenty minutes and, more expensively, their trust in everything else the file says.
 
::: info
**_On using AI to write documentation_**
 
This is one of the places where modern AI tools and coding agents genuinely earn their place. They are very good at producing documentation, especially if you tell them what you want a README to contain rather than asking for one generically. Give the model your preferred structure, point it at the codebase, and it will do a competent first pass in seconds.
 
The caveat is the obvious one: double check it. A model will happily document a function argument that does not exist, or describe what your code appears to do rather than what it does. Treat the output as a draft written by someone who read the code quickly, because that is roughly what it is.
:::
 
### Notes, dictionaries, and codebooks
 
A README should orient a newcomer. It should not contain everything. This is the same principle that governs the next section of this guide: **modularity applies to documentation just as much as it applies to code**. A three-thousand-word README is as unreadable as a three-hundred-line function, and for the same reason. Nobody can hold it in their head, so nobody reads it, so it goes stale, so it becomes actively misleading.
 
What I do in practice is keep a dedicated `notes/` directory, with the README acting as an index that points into it. What lives there depends on the project, but the recurring items are:
 
- **Methodology notes.** The analytical decisions and why they were made. Which specification, which sample restrictions, which robustness checks were run and discarded.
- **Data dictionaries and codebooks.** What each variable means, its units, its permitted values, how missingness is coded. For survey and administrative data this is not optional documentation, it is the only thing standing between a reader and a serious misinterpretation.
- **Metadata.** Provenance of each input: where it came from, when it was retrieved, which version. This connects directly to the runtime metadata practice covered in the [traceability section](./traceability.md#metadata-capture-at-runtime).
- **A decision log.** Short, dated entries recording choices that were argued about. This is the cheapest documentation you will ever write and the one you will be most grateful for when someone asks, two years later, why the sample starts in 2014.
For research projects specifically, this layer stops being a nice-to-have. I have submitted papers to journals and put together replication packages to go with them, and the thing that becomes obvious quickly is that journals impose hard limits on length. Whole categories of methodological detail get compressed into a footnote or cut entirely, not because they are unimportant but because there is no room for them. What that means in practice is that the repository, not the paper, ends up being the real source of knowledge about how the analysis was actually done, even though the paper is the thing that gets cited. If the credibility of a finding rests on the analytical process, then the analytical process needs to be legible to someone who was not in the room, and for most published work that legibility lives in the repository or it does not exist at all.
 
### Documenting the code itself
 
Function-level documentation is the last layer. In R this means `roxygen2` comments above each function, which generate the `man/` pages and give you the help files you would expect from any package. In Python it means docstrings, and I would add type hints to the same category, since a signature that declares what goes in and what comes out is documentation that cannot rot as quietly as a prose description can.
 
Both are covered thoroughly in their own ecosystems, so rather than duplicating that here:
 
- [roxygen2](https://roxygen2.r-lib.org/)
- [PEP 257, on Python docstring conventions](https://peps.python.org/pep-0257/)
I will be honest that writing these is tedious. It is the kind of task that gets postponed indefinitely because the code already works. This is the second place where AI is a real help: given clean code with good names and comments that explain the non-obvious choices, a model can generate roxygen blocks or docstrings that need only light editing. Note the condition, though. The quality of what you get back is a direct function of how readable the code was to begin with, which is a decent argument for the rest of this section.
 
## Comments
 
I lean purist on comments. The common position in software engineering is that a comment is an admission that the code failed to explain itself, and most of the time that is correct: if you need a comment to explain what a line does, the better fix is usually a clearer name or a smaller function.
 
But I have never written a piece of code that needed no comments at all. There is always a choice, a threshold, a workaround, or an ordering that deserves special attention, and no amount of naming discipline will surface it. A good variable name can tell the reader that a series is winsorized at the 99th percentile. It cannot tell them that this threshold is the one the 2019 methodology note settled on, and that changing it breaks comparability with the published series. That is domain knowledge. It has no home inside the code, and the comment is exactly the right place for it.
 
So the rule is not "write fewer comments." It is:
 
**Comment the why, never the what.** A comment that restates the line above it adds nothing on the day it is written and becomes a lie the day the line changes. A comment that explains why the line exists stays true.
 
```r
# Bad: restates the code
# filter out rows where income is missing
df <- df |> dplyr::filter(!is.na(income))
 
# Good: explains the decision
# 2019 methodology note excludes non-responses rather than imputing them,
# so that the series stays comparable with published figures
df <- df |> dplyr::filter(!is.na(income))
```
 
**Write comments for your future self.** This is the framing I find most useful, because it sidesteps the question of whether anyone else will ever read the code. Somebody will: you, in eight months, with no memory of this project, under time pressure, trying to work out whether that hardcoded 0.05 was a considered choice or a leftover. Write for that person. They deserve better than what you are currently planning to give them.
 
## Style guides, formatters, and linters
 
Two tools frequently get lumped together here, and separating them clears up most of the disagreement about how much automation is appropriate.
 
A **formatter** rewrites your code's whitespace, indentation, and line breaks according to fixed rules. It is deterministic and there is nothing to argue about, which is precisely the point: it removes an entire category of preference from the table and makes diffs reflect actual changes rather than someone's spacing habits. [Air](https://posit-dev.github.io/air/) is the current answer in R, and [Ruff](https://docs.astral.sh/ruff/) covers both formatting and linting in Python. I would recommend running a formatter without much hedging. The cost is close to zero.
 
A **linter** is a different proposition. It flags patterns it considers problematic, and a meaningful share of those judgments are taste rather than correctness. Here I will be honest about my own practice: I use linters very minimally. What I actually work from is a personal style guide, assembled over time from elements of the popular guides and the rules the community has broadly converged on. That is not a recommendation to skip linting, and on a team a shared linter configuration settles arguments that would otherwise recur forever. But I am not going to pretend to a discipline I do not practice.
 
The more important point is that **what works in one language does not transfer to another**. Python has PEP 8 and a culture that enforces it, so "follow the convention" is straightforward advice. R has no equivalent authority: the tidyverse style guide, the Google R style guide, and base R conventions disagree with each other on real questions, and base R is not internally consistent enough to serve as a model. So the same instruction is a genuine judgment call in R and a settled matter in Python. Code written by someone importing one language's habits into the other tends to be technically fine and read as foreign, which is a topic in its own right and one we come back to in the section on idiomaticity.
 
---
 
One thing this section has deliberately left out is how long a function should be, or how much a single unit of code should try to do. Those are readability concerns in effect, since a two-hundred-line function is unreadable regardless of how well its variables are named, but the actual discipline behind them is decomposition. That is the subject of the next section, and it is worth noting the direction of the relationship before moving on: modular code tends to be readable almost as a side effect, but readable code does not modularize itself. Naming, structure, documentation, and comments will get you a long way. They will not save a workflow that is badly factored.