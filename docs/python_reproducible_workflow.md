# Setting Up A Python Reproducible Workflow

## Starting a New Project

Every reproducible Python workflow starts the same way: a version-controlled project with an isolated, explicitly declared package environment. Getting both in place from the beginning is far easier than retrofitting them later, and [uv](https://docs.astral.sh/uv/) makes the whole thing fast enough that there is no real excuse not to do it.

Before walking through the steps, it is worth saying upfront: **always write your Python code as a proper module**. More on what that means in the best practices section, but structuring your project with a `src/` layout from the start will save you a surprising amount of pain later on.

To create a new project with [uv](https://docs.astral.sh/uv/), open your terminal, navigate to wherever you want the project to live, and run:

```bash
uv init my-project
cd my-project
```

This scaffolds a minimal project directory for you. By default, `uv init` creates a flat layout with a `hello.py` file at the root. That is fine for quick scripts, but for a proper analytical project you will want the `src/` layout instead. You can get that with:

```bash
uv init my-project --lib
cd my-project
```

The `--lib` flag creates a `src/my_project/` directory with a proper Python package structure. This is the layout we will follow for the rest of this section, and the one we recommend for any project that you expect to grow, be shared, or run in different environments.

::: info
**A note on package naming**

Python package names have a few constraints worth knowing. The name you give your package in `uv init` (and later in `pyproject.toml`) should use lowercase letters, numbers, and hyphens for the distribution name, but the importable module name inside `src/` uses underscores instead of hyphens. So a project named `my-project` will have its code living in `src/my_project/`. This is a Python convention, not a `uv` quirk, and it is one of those things that trips people up early on.
:::

After running `uv init --lib`, your project will look roughly like this:

```
my-project/
├── src/
│   └── my_project/
│       └── __init__.py
├── pyproject.toml
├── README.md
└── .python-version
```

The `pyproject.toml` file is the heart of your project. It declares the package name, description, required Python version, and dependencies. The `.python-version` file tells `uv` (and other tools) which Python version to use for this project. Both should be committed to version control.

The next step is to initialize Git:

```bash
git init
git add .
git commit -m "Initial project setup"
```

At this point you have the two most important foundations for a reproducible workflow: an isolated, declarative environment managed by `uv`, and a Git repository ready to record the history of your project.

## Version Control with Git and GitHub

With Git initialized in your project, you have a system that records every intentional change you make to your codebase. But having Git set up and actually using it well are two different things. This section covers the core commands you will reach for on a daily basis, explains what each one does, and closes with a habit that will serve you well long before you ever work on a team.

All of the commands below are run from your terminal, inside your project directory.

:::info
**_A note on GitHub Desktop_**

If you are new to Git and the terminal feels like too much at once, [GitHub Desktop](https://github.com/apps/desktop) is a visual interface that lets you commit, push, pull, and manage branches without writing a single command. It is genuinely helpful for getting started and understanding what is happening visually before the mental model fully clicks.

That said, the recommendation here is to use it as a bridge, not a destination. The terminal commands are simple, universal, and available in every environment you will ever work in. A GUI is not. Getting comfortable with the commands above means you are never dependent on a specific tool, and you can work just as fluently on a remote server, a CI pipeline, or a colleague's machine as you can on your own.
:::

![](/github_desktop.png)

### Linking your local repository to GitHub

At this point, you have a local Git repository, but it only exists on your machine. To push your work to GitHub and make it accessible to collaborators (or just safely backed up), you need to create a remote repository and link the two together.

**From the terminal**, the process is two steps: first create an empty repository on [github.com](https://github.com) (with no README, `.gitignore`, or license, since your local project already has its own history and adding those files on the GitHub side will create a conflict), then link it to your local project:

```bash
# Link your local repo to the GitHub remote
git remote add origin https://github.com/your-username/your-repo-name.git

# Rename the default branch to main (if it isn't already)
git branch -M main

# Push your local history to GitHub and set the upstream tracking branch
git push -u origin main
```

The `-u` flag sets the upstream tracking relationship, meaning that from this point on, a plain `git push` or `git pull` will know which remote branch to talk to without you having to specify it every time.

**From GitHub Desktop**, this is simpler: clicking "Publish Repository" handles both steps at once, creating the remote repository on GitHub and linking it to your local project in a single action. This is one of the cases where the GUI genuinely saves you a step. That said, it is still worth knowing what is happening under the hood.

:::info
It is also worth knowing that both **RStudio** and **Positron** have native Git integration built directly into the IDE. You can stage files, write commit messages, push, pull, and manage branches without ever leaving your editor. If you prefer to keep everything in one place, that is a perfectly reasonable way to work. Personally, I find GitHub Desktop cleaner for this, since it keeps version control concerns separate from the coding environment, but this is genuinely a matter of taste. All three options, terminal, GitHub Desktop, and your IDE, are talking to the same underlying Git repository, so whatever feels most natural is the right choice.
:::

After either approach, your local repository and GitHub are in sync, and you are ready to follow the branching workflow described below.

### The core commands

**Staging and committing changes**

A commit is a named, timestamped snapshot of your project. Before you can commit, you need to tell Git which changes to include, this is called staging.

```bash
# Stage a specific file
git add path/to/file.R

# Stage all changed files in the project
git add .

# Create a commit with a descriptive message
git commit -m "Add data cleaning function for income variable"
```

A good commit message describes *why* the change was made, not just what file was touched. "Fix bug" tells you nothing six months from now. "Fix null handling in income variable before model fitting" does.

**Pushing changes to GitHub**

Once you have one or more commits locally, you push them to the remote repository on GitHub so they are backed up and visible to collaborators.

```bash
git push origin your-branch-name
```

**Fetching and pulling changes from GitHub**

When collaborators (or you, from another machine) have pushed changes to GitHub, you need to bring those changes into your local copy.

```bash
# Fetch checks what has changed on the remote, without applying anything yet
git fetch origin

# Pull fetches and immediately merges those changes into your current branch
git pull origin your-branch-name
```

A good habit is to always `pull` before you start working in a session, so you are not building on top of a stale version of the code.

**Creating a new branch**

A branch is an isolated copy of the codebase where you can work freely without affecting the main version. When the work is ready, it comes back through a pull request (more on that below).

```bash
# Create a new branch and switch to it immediately
git checkout -b feature/add-cleaning-functions
```

Branch names should be short and descriptive. Prefixes like `feature/`, `fix/`, or `analysis/` help keep things organized as a project grows.

**Opening a pull request**

A pull request (PR) is a request to merge your branch back into the main branch. It creates a review checkpoint, a moment where the change is visible, discussable, and intentional, before it becomes part of the permanent record. Pull requests are opened through the GitHub web interface (or via the GitHub CLI), not from the terminal directly.

Once you have pushed your branch:

```bash
git push origin feature/add-cleaning-functions
```

Go to your repository on GitHub. You will see a prompt to open a pull request for your recently pushed branch. From there, add a description of what changed and why, and merge it when it is ready.

### Always work on a branch, even alone

It might feel unnecessary to create a branch when you are the only person on a project. It is not. The habit of never committing directly to `main` is one of those things that costs almost nothing to practice alone and pays off immediately the first time you collaborate with someone else. Beyond collaboration, branches let you keep the main version of your code in a working state while you experiment, and they give you a clean place to abandon an approach that did not work out without leaving traces in the main history.

Make it a rule: new feature, new analysis, new idea, new branch.

## Managing Dependencies with uv

As discussed in the [portability section](./portability.md#python-uv), `uv` replaces the fragmented ecosystem of `pyenv`, `venv`, `pip`, and `pip-tools` with a single, fast, coherent tool. This section covers the day-to-day commands you will reach for most often.

### The two key files

Before getting into commands, it helps to understand what `uv` actually produces and why both files matter.

**`pyproject.toml`** is where you declare your project's dependencies. You specify which packages your project needs, and optionally which versions are acceptable. This file is human-maintained: you are the one who decides what goes in here, and it is the place a collaborator looks to understand what your project depends on conceptually.

**`uv.lock`** is the lockfile that `uv` generates automatically. It records the exact, resolved version of every package (and every transitive dependency) that was installed in your environment. Unlike `pyproject.toml`, you never edit this file by hand. It is entirely managed by `uv`. Both files should always be committed to version control. The `pyproject.toml` is your intent; the `uv.lock` is the guarantee.

### Creating and syncing the virtual environment

When you first clone a project (or after any change to the lockfile), you want to restore the environment to its exact recorded state:

```bash
uv sync
```

That is it. `uv` reads the lockfile, creates a virtual environment in a `.venv/` folder at the project root, and installs every dependency at the exact version recorded. If no lockfile exists yet, `uv` resolves your declared dependencies and creates one. The speed here is not just a nice-to-have: `uv sync` is fast enough that you stop thinking of environment restoration as a chore, which makes you much more likely to actually do it.

You do not need to activate the virtual environment manually for most operations. `uv` handles the environment context automatically when you use `uv run` (more on that below). If you do want to activate it in your shell for interactive use, the standard approach still works:

```bash
# On macOS/Linux
source .venv/bin/activate

# On Windows
.venv\Scripts\activate
```

### Adding and removing dependencies

To add a package to your project:

```bash
uv add pandas
uv add "scikit-learn>=1.3"
```

This does two things at once: it adds the package to the `dependencies` list in `pyproject.toml`, and it updates the lockfile to reflect the resolved version. You do not need to run a separate snapshot command as you would with `renv`. The lockfile is always kept in sync.

To add a development dependency (a package you need for testing or development but not for running the analysis itself):

```bash
uv add --dev pytest
uv add --dev ruff
```

Development dependencies are recorded in `pyproject.toml` under `[dependency-groups]` and are not installed when someone installs your package as a dependency of their own project.

To remove a package:

```bash
uv remove pandas
```

Again, this updates both `pyproject.toml` and the lockfile in one step.

### Checking your environment

You can inspect the current state of your environment at any time:

```bash
# Show what is installed and at which version
uv pip list

# Show the resolved dependency tree
uv tree
```

`uv tree` is particularly useful for understanding why a specific version of a package was chosen. When a version conflict arises, it gives you a clear picture of what is pulling what.

### Running scripts with `uv run`

One of the most useful features of `uv` is the ability to run scripts directly within the project's environment without activating it first:

```bash
uv run python src/my_project/main.py
uv run python -m my_project
uv run pytest
```

`uv run` ensures that the script executes against the correct virtual environment, which means you can call it from anywhere (including from CI pipelines, scheduled jobs, or shell scripts) and always get the right environment. This is especially valuable for reproducibility: no one needs to remember to activate an environment before running something.

### Upgrading dependencies

When you want to upgrade a package to its latest compatible version:

```bash
uv lock --upgrade-package pandas
```

To upgrade everything at once:

```bash
uv lock --upgrade
```

Note that `uv lock --upgrade` updates the lockfile but does not install the new versions into your environment. You need to follow it with `uv sync` to actually update your environment. This two-step process is intentional: it gives you a chance to review what changed in the lockfile before applying it.

## Versioning Data with DVC

As discussed in the [traceability section](./traceability.md#dvc-versioning-data-alongside-code), data files should be versioned alongside code. The problem is that Git was not designed for large binary files: committing a 500MB Parquet file to a repository makes it slow, bloated, and practically unusable. DVC solves this by keeping large files in a separate storage backend while using Git to track a small pointer file that records exactly which version of the data corresponds to which version of the code.

### How DVC works

The core idea is clean: you tell DVC to track a file, it moves the actual file to a local cache and stores a tiny `.dvc` pointer file in its place. That pointer file goes into Git. The actual data goes to a remote storage backend of your choice (an S3 bucket, Google Cloud Storage, a shared network drive, etc.). When a collaborator clones the repository and runs `dvc pull`, they get exactly the version of the data that corresponds to the current Git commit.

### Installation and setup

Install DVC as a development dependency in your project:

```bash
uv add --dev dvc
```

If you are working with a specific remote storage backend, you will want the corresponding extra:

```bash
uv add --dev "dvc[s3]"      # For Amazon S3
uv add --dev "dvc[gs]"      # For Google Cloud Storage
uv add --dev "dvc[azure]"   # For Azure Blob Storage
```

Initialize DVC in your project (this must be run inside a Git repository):

```bash
dvc init
```

This creates a `.dvc/` directory with some configuration files and a `.dvcignore` file (analogous to `.gitignore`, but for DVC). Commit these to Git:

```bash
git add .dvc/ .dvcignore
git commit -m "Initialize DVC"
```

### Tracking data files

Let us say you have a raw survey dataset sitting at `data/raw/survey.parquet`. To put it under DVC tracking:

```bash
dvc add data/raw/survey.parquet
```

DVC does two things here. It moves the file's content to the local cache (`.dvc/cache/`) and creates a pointer file at `data/raw/survey.parquet.dvc`. That pointer file contains the file's hash and some metadata, and it is what goes into Git.

DVC also updates your `.gitignore` to exclude the actual data file from Git tracking. You should commit both the pointer file and the updated `.gitignore`:

```bash
git add data/raw/survey.parquet.dvc data/.gitignore
git commit -m "Track raw survey data with DVC"
```

From this point on, `data/raw/survey.parquet` is tracked by DVC, not Git.

### Configuring a remote storage backend

For DVC to be useful for sharing data with collaborators, you need to configure a remote storage backend. The most common setup is an S3 bucket:

```bash
dvc remote add -d myremote s3://your-bucket-name/dvc-storage
```

The `-d` flag sets this as the default remote. For a shared team setup, commit this configuration:

```bash
git add .dvc/config
git commit -m "Configure DVC remote storage"
```

For local development without cloud storage, you can use a local directory as the remote (useful for testing the workflow before setting up cloud infrastructure):

```bash
dvc remote add -d localremote /path/to/shared/drive/dvc-storage
```

### Pushing and pulling data

Once your remote is configured, pushing data is straightforward:

```bash
dvc push
```

This uploads all tracked files that are not already in the remote. When a collaborator clones the repository and wants to get the data:

```bash
dvc pull
```

This downloads exactly the versions of the data files that correspond to the current Git commit. If they check out an older Git commit (say, to reproduce a result from three months ago), `dvc pull` will retrieve the corresponding version of the data from that point in time. This is the core reproducibility guarantee that DVC provides.

### The typical workflow

In day-to-day use, the DVC workflow integrates naturally with Git:

```bash
# 1. You receive an updated dataset
# Replace data/raw/survey.parquet with the new file

# 2. Re-track the updated file with DVC
dvc add data/raw/survey.parquet

# 3. Commit the updated pointer file alongside any code changes
git add data/raw/survey.parquet.dvc
git commit -m "Update survey data to 2024 version"

# 4. Push both code (to GitHub) and data (to remote storage)
git push
dvc push
```

A collaborator who pulls your changes gets a working environment with a `dvc pull`:

```bash
git pull
dvc pull
```

### Tracking pipeline outputs

Beyond raw input data, DVC can also track processed datasets and model artifacts. If you have a processing step that transforms your raw data, you can track both the input and the output:

```bash
dvc add data/processed/survey_clean.parquet
```

For more complex pipelines with multiple stages, DVC has a pipeline system (`dvc.yaml`) that can encode dependencies between stages and allow selective re-execution when inputs change. For most analytical workflows, simple `dvc add` tracking is sufficient. The pipeline system becomes valuable when you are working with long-running training jobs or multi-stage transformations where you want DVC to figure out what needs to re-run automatically.

::: info
**A note on `.gitignore` and DVC**

When you run `dvc add` on a file, DVC automatically adds that file to the nearest `.gitignore`. This is intentional: you want Git to ignore the actual data files and only track the `.dvc` pointer files. If you ever find that a data file is being tracked by both Git and DVC, that is a sign something went wrong. The rule is simple: a file is either tracked by Git or tracked by DVC, never both.
:::

## Best Practices for Managing Your Project

### Write your code as a module with a `src/` layout

The `--lib` flag we used when initializing the project already gave us the `src/` layout, but it is worth understanding why this matters.

When your code lives in `src/my_project/`, Python will only be able to import it if the package is properly installed (even in development mode, via `uv sync`). This might sound like a inconvenience, but it is actually a valuable constraint. It prevents the common trap of a script silently importing from the wrong place (for instance, picking up a module from the current working directory instead of the installed package). The [src layout explicitly avoids this class of import confusion](https://packaging.python.org/en/latest/discussions/src-layout-vs-flat-layout/).

Organize your code into logical modules inside `src/my_project/`. Each module should have a single, clear responsibility:

```
src/
└── my_project/
    ├── __init__.py
    ├── ingestion.py       # everything related to loading raw data
    ├── cleaning.py        # transformation and cleaning logic
    ├── modeling.py        # model training and evaluation
    └── visualization.py   # plotting functions
```

Each function should do one thing well. The goal is the same as in the R guide: a future collaborator should be able to open any file in this directory and understand its purpose without reading the whole codebase.

### Use a `main.py` as your entry point

Every project should have a single, unambiguous way to run it end to end. For a Python project, that is a `main.py` script at the root of your `src/my_project/` directory that orchestrates the full workflow by calling the functions defined in your modules.

```python
# src/my_project/main.py
import argparse
from my_project.ingestion import load_raw_data
from my_project.cleaning import clean_survey_data
from my_project.modeling import fit_model


def main():
    parser = argparse.ArgumentParser(description="Run the survey analysis pipeline")
    parser.add_argument("--input", required=True, help="Path to raw input data")
    parser.add_argument("--year", type=int, default=2024, help="Survey year to process")
    parser.add_argument("--output", default="outputs/", help="Directory for outputs")
    args = parser.parse_args()

    raw = load_raw_data(args.input)
    clean = clean_survey_data(raw, year=args.year)
    fit_model(clean, output_dir=args.output)


if __name__ == "__main__":
    main()
```

This script becomes your one-click entry point, runnable from the terminal via `uv run`:

```bash
uv run python -m my_project.main --input data/raw/survey.parquet --year 2024
```

The `argparse` integration is worth the small upfront investment. It gives you a self-documenting interface (`uv run python -m my_project.main --help` will print the available arguments and their defaults), makes it easy to run the pipeline with different configurations without editing code, and plays nicely with CI pipelines and scheduled jobs.

This approach also directly addresses the concern raised in the [traceability section](./traceability.md#linear-execution-and-the-notebook-trap): a `main.py` that is run via `uv run` always executes from a clean environment, top to bottom, with no hidden state. There is no way for a stale variable to sneak in from a previous interactive session.

### Use notebooks only for exploration, and keep them in a `notebooks/` directory

As discussed in depth in the [traceability section](./traceability.md#linear-execution-and-the-notebook-trap), notebooks are genuinely useful tools for a specific purpose: exploration, prototyping, and communication. They are the wrong tool for production code, for anything that needs to run reliably in a clean environment, or for anything you want to version control cleanly.

The practical rule is simple: keep a dedicated `notebooks/` directory at the project root, and treat everything inside it as exploratory scratch space.

```
notebooks/
├── 01_data_exploration.ipynb
├── 02_model_prototyping.ipynb
└── 03_results_visualization.ipynb
```

Once you have figured something out in a notebook, the logic moves into `src/my_project/`. The notebook served its purpose. It is a thinking tool, not a production artifact.

A few habits that help:

**Name notebooks with a numeric prefix.** `01_`, `02_`, etc. communicates the intended order and makes the directory readable at a glance.

**Never import from `notebooks/` in `src/`.** The dependency should only flow one way: notebooks import from your package, your package does not import from notebooks.

**Restart and run all before committing.** If you do commit a notebook (for example, as part of a paper supplement or a tutorial), always restart the kernel and run all cells from top to bottom before doing so. A notebook where cells have been run out of order, or where the kernel holds state that is not reflected in the code, is not reproducible. Committing it is misleading to anyone who tries to run it later.

For those who find the Jupyter hidden-state problem frustrating enough to want a structural solution, it is worth knowing that [marimo](https://marimo.io/) takes a different architectural approach, where cells form a dependency graph and outputs are always in sync with the code. We mentioned it briefly in the traceability section, and it is worth exploring if you find yourself fighting Jupyter regularly.

### Use `python-dotenv` for secrets and environment variables

As covered in the [portability section](./portability.md#secrets-and-paths), secrets and credentials must never appear in your code or in any file committed to version control. In Python, the standard solution is `python-dotenv`.

Add it as a dependency:

```bash
uv add python-dotenv
```

Create a `.env` file at the project root (and make sure it is listed in your `.gitignore`):

```
API_KEY="your-api-key-here"
DB_PASSWORD="your-db-password-here"
SHAREPOINT_DATA="/Users/yourname/YourOrg/ProjectName - Documents/data"
```

Load the variables at the start of your `main.py` or wherever they are needed:

```python
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ["API_KEY"]
db_password = os.environ["DB_PASSWORD"]
```

A few things worth being deliberate about here. Using `os.environ["KEY"]` (with square brackets) rather than `os.environ.get("KEY")` means your code will raise a clear `KeyError` if the variable is not set, rather than silently returning `None` and potentially producing confusing errors downstream. Failing loudly and early is almost always better than failing quietly later.

Each collaborator maintains their own `.env` file with their own credentials. The file is never committed. The code itself only references the variable names, which means it is portable across every environment where those variables are defined.

Document the required environment variables in your `README`. A new collaborator should be able to read the README, create their `.env` file, run `uv sync`, and have everything working without needing to ask anyone what variables to set. That is the standard a well-set-up project should meet.

---

With these four practices in place (a `src/` module layout, a `main.py` entry point, notebooks kept to their proper place, and secrets managed through environment variables) you have a project structure that is portable, traceable, and built to be understood by someone other than you. That is the standard worth aiming for.
