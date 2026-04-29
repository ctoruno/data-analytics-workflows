# Introduction

## What Do We Mean by Data and Analytical Workflows?

Before anything else, let's get on the same page about what this guide is actually about, because "data and analytical workflows" can mean a lot of different things to a lot of different people.

For the purposes of this guide, a **data and analytical workflow** is any project where the primary work happens through scripted analysis (writing code in a language like R or Python) to turn raw data into something meaningful. That output can take many forms

- **A data product**: a clean dataset, a set of tabular data tables, a dashboard, or any other artifact whose primary value is the data itself.
- **An analytical output**: visualizations, reports, statistical analyses, or research tables that communicate findings derived from data.
- **A statistical or machine learning model**: any formalized procedure that learns from data to make predictions, classifications, or inferences.

This deliberately excludes work that lives primarily in the data infrastructure layer: SQL pipelines, data warehouse transformations, or orchestration platforms like Airflow or Databricks. That work is equally important and has its own craft, conventions, and literature. However, those fall outside the scope of this guide.

But defining the output is only half of it. The "workflow" part is equally important. A workflow is the full chain of steps, from raw data to final deliverables, including how data is acquired, processed, analyzed, and shared. In their [Reproducible Research Fundamentals](https://courses.wbginstitute.org/course/reproducible-research-fundamentals-new-edition), the World Bank makes an observation that resonates deeply: code is most often thought of as just a means to an end. A tool you use to get the answer, and then discard. This framing is reinforced by the fact that writing good code is rarely taught in most statistics, economics, or data science programs. You pick it up as you go, optimizing for "it works" rather than "someone else can read and run this." But it's not just the code. It's the decisions, the structure, the documentation, and the practices that make that chain coherent and repeatable. In that sense, your code is not a disposable byproduct of your analysis, it is an output in its own right, and it deserves to be treated as one.

It's also worth noting that this guide intentionally blurs the line between what some people call "data engineering" and "analytical work." In my experience, data professionals very often end up doing both, and the principles that make a pipeline robust are not that different from the ones that make an analysis trustworthy. So rather than drawing that line, we are going to ignore it.

Finally, these workflows range enormously in complexity. A workflow can be a 50-line R script that someone runs once or twice, or a fully automated pipeline feeding a production dashboard updated in real time. The principles in this guide scale across that spectrum, but as we'll discuss shortly, they don't all apply equally to every situation.

## Why Does It Matter? The Case for Reproducible, Maintainable, and Optimal Workflows

Let's be honest about something first. If you work primarily with data — as an analyst, a researcher, a data scientist, or any adjacent role — you might not think of yourself as a developer. Developers are those people who write pristine, architected code and ship polished packages that thousands of people use. That's not you, right? You just write code to get your analysis or outputs done.

The thing is, you *are* a developer. Bruno Rodrigues puts it well in his book [*Building Reproducible Analytical Pipelines with R*](https://raps-with-r.dev/):

> "It's just that your focus is on writing code for your purposes to get your analyses going instead of writing code for others. Or at least, that's what you think. Because in *others*, your team-mates are included. Reviewers and auditors are included. Any people that will read your code are included, and there **will** be people that will read your code. At the very least future you will read your code."

That reframe matters a lot. Once you accept that your code has an audience, even if that audience is just you, six months from now, the case for better practices becomes much more personal and immediate.

So what are we actually aiming for? Let's define the three pillars briefly, because
they are related but not the same thing:

- **Reproducibility** means that someone else, or you, can take your code and your data and arrive at exactly the same results. This is about correctness and trust. As the [World Bank's DIME Analytics Data Handbook](https://worldbank.github.io/dime-data-handbook/) frames it, reproducibility is ultimately a form of accountability: to your collaborators, to your reviewers, and in many cases to the institutions and communities your work is meant to serve.
- **Maintainability** means that the codebase can be understood, modified, and extended without requiring heroic effort. A maintainable workflow doesn't fall apart when someone new joins the project, when requirements change, or when the original author has long forgotten what a particular function was supposed to do.
- **Optimality** means the workflow is efficient, not necessarily in the computer-science sense of squeezing every millisecond of performance, but in the practical sense of minimizing unnecessary repetition, fragility, and manual intervention.

And the cost of ignoring all three? It tends to reveal itself slowly, and then all at once. There have been many times where a task seemed small enough that it didn't justify the upfront investment of a proper workflow setup. Then the "small" task grows. What started as a quick script becomes a complex codebase. And by the time you realize you need version control, or modular functions, or a proper environment setup, the cost of retrofitting them is so high it almost requires rewriting everything from scratch. It's a trap that's very easy to fall into, and very painful to get out of.

## Not Every Project Needs Everything

This guide is not a checklist that every project must complete in full. That would be both impractical and, frankly, counterproductive. A small one-off analysis has different needs than a production pipeline serving a government agency. Blindly applying every principle to every project is a recipe for over-engineered, slow-moving work, and it can make people resent the process altogether.

That said, here's a personal take worth sharing: in practice, it's almost always better to over-invest at the start of a project and then realize you overdid it, than to under-invest and later discover you desperately needed those foundations. The asymmetry is stark. Pulling back from a too-thorough setup is cheap. Retrofitting structure into a sprawling, unorganized codebase is expensive and demoralizing.

So yes, you will have to make judgment calls. This guide will try to help you make those calls well, but it can't make them for you. What it can do is document what good practice looks like so that when a project *does* require it, you know what to reach for.

There is one important exception to the "it depends" framing: **research projects**. Projects that produce findings intended for publication, policy decisions, or peer review carry a much stronger obligation to reproducibility. When the credibility of a conclusion depends on the integrity of the analytical process, most of the principles in this guide stop being optional. We'll treat research workflows as a specific case throughout the guide.

## Why This Guide Exists

After ten years of working with data across different fields, institutions, and technologies, and after reading and following many of the best guides and resources out there, one thing became clear: there isn't a single guide that felt fully complete.

Part of the problem is that the field has no consensus. What one guide presents as the gold standard, another expert will argue against. Best practices evolve, new tools emerge, and what felt like a settled question a few years ago might look naïve today. That's not a criticism of the existing literature, it's just the nature of a fast-moving field.

This guide draws on many of those existing resources, but it also draws heavily on personal experience, on the workflows that worked, the ones that failed spectacularly, and the lessons that didn't come from any book. I started thinking on these principles back in 2023 when I, along with my friend and former colleague [Santiago Pardo](https://github.com/aspardog), was starting to define what we meant by "workflow." I actually published an initial [set of ideas in my personal blog](https://www.carlos-toruno.com/blog/workflow/) containing some of the principles that we were discussing back then. This guide is a reflection on how those ideas evolved into a more structured way of thinking.

The goal is not to be comprehensive in a theoretical sense. The goal is to be *useful*, to give you a practical, opinionated set of guidelines grounded in real experience, while being honest about where reasonable people disagree.

One last thing: this is an ongoing field. Tools and libraries that solve these problems in new ways appear regularly, and what is state of the art today may be an outdated approach tomorrow. This guide represents a snapshot of hard-won knowledge, and that itself has value — even knowing that it will need to evolve.

## A Note on Programming Languages

The practical examples and implementations in this guide are primarily in **R** and **Python**. These are the two languages that I use on a daily basis, and the ones where the examples will be most thorough and up to date.

That said, the *principles* this guide covers are language-agnostic. Whether you work in Stata, Julia, or something else entirely, the underlying ideas about reproducibility, code organization, and workflow structure apply just the same. Practical additions covering **Stata** and **Julia** are planned as future additions to this guide.

## Who Is This Guide For?

This guide is aimed at anyone who writes code to work with data: analysts, researchers, data scientists, or anyone in a role where the primary deliverable comes from turning raw data into something meaningful. It assumes you're comfortable writing code in R or Python (or both), but it doesn't assume any particular level of software engineering background. In fact, it's probably most useful for people who *don't* have that background and have been picking up workflow practices on their own, trial-and-error style.

If that's you... welcome. This was written with you (and me) in mind.
