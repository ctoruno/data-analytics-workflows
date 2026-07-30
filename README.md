# Principles for Data and Analytical Workflows

A practical, opinionated guide to building data and analytical workflows
that are reproducible, maintainable, and optimal. Written for analysts,
researchers, and data scientists who write code to work with data but may
not have a formal software engineering background.

**Read it online: https://ctoruno.github.io/data-analytics-workflows/**

## What this guide covers

The guide is organized around three core principles:

- **Reproducibility**: openness, portability, and traceability
- **Maintainability**: readability, modularity, observability, and idiomaticity
- **Optimality**: efficiency and scalability

Practical examples are primarily in **R** and **Python**, though the
principles are language-agnostic. Stata and Julia coverage is planned.

## Status

This is a living document. Content is added and revised regularly as tools
evolve and new lessons accumulate.

---

## How the site is built

The book is a [VitePress](https://vitepress.dev/) site. VitePress is a static
site generator: you write Markdown files, it turns each one into an HTML page,
and the result is a folder of plain static files that any web server (here,
GitHub Pages) can serve. There is no database and no backend.

Three things are worth understanding about how VitePress works:

1. **Every Markdown file under [docs/](docs/) becomes a page.** The file path
   determines the URL. `docs/openness.md` is served at `/openness`,
   `docs/index.md` is the site root. There is no separate routing config,
   and no registry of pages you have to update for a page to exist.
2. **[docs/.vitepress/config.mjs](docs/.vitepress/config.mjs) controls
   navigation, not content.** The sidebar and top nav are explicit lists in
   that file. A Markdown file that is not listed there still builds and is
   still reachable by URL, it just does not appear in the sidebar. This is the
   single most common thing to forget when adding a page.
3. **Markdown can contain HTML and Vue components.** Useful for things the
   Markdown syntax does not cover, but for ordinary prose plain Markdown is
   enough. VitePress also adds its own extensions on top: containers
   (`::: tip`, `::: warning`, `::: details`), line highlighting in code
   fences, and code groups.

### Repository layout

```
docs/
├── .vitepress/
│   ├── config.mjs          # site config: title, nav, sidebar, base URL
│   ├── theme/              # theme customization (extends the default theme)
│   ├── cache/              # build cache        (gitignored)
│   └── dist/               # build output       (gitignored)
├── public/                 # static assets, copied verbatim to the site root
│   ├── .nojekyll           # tells GitHub Pages not to run Jekyll on the output
│   └── *.png, *.jpeg       # images used across the book
├── index.md                # landing page (uses the `home` layout)
└── *.md                    # one file per section of the book
.github/workflows/deploy.yml  # builds and publishes on every push to master
package.json                  # dependencies and the docs:* scripts
```

### Running the site locally

Requires Node.js (the deploy workflow uses Node 24).

```bash
npm install          # once, after cloning
npm run docs:dev     # dev server at http://localhost:5173 with hot reload
npm run docs:build   # production build into docs/.vitepress/dist
npm run docs:preview # serve the production build locally
```

`docs:dev` is what you want while writing: saving a Markdown file updates the
browser immediately. Run `docs:build` before pushing if you have touched
`config.mjs` or added links, since some problems (a broken internal link, for
instance) only surface as build errors.

---

## Adding a new section to the book

### 1. Create the Markdown file

Add a file in [docs/](docs/), named in `snake_case` to match the existing
pages, e.g. `docs/scalability.md`. Content pages need **no frontmatter**, they
just start with a level-1 heading:

```markdown
# Scalability

Opening paragraph...

## First subsection

...
```

Conventions used throughout the book:

- **One `#` heading per page.** It becomes the page title.
- **`##` and `###` build the "On this page" outline**, configured in
  `config.mjs` under `outline`. Deeper headings are not shown.
- **Internal links point at the `.md` file**, e.g.
  `[introduction](./introduction.md#not-every-project-needs-everything)`.
  VitePress rewrites these to the correct URL at build time and, unlike raw
  URLs, it will fail the build if the target does not exist.

### 2. Register it in the sidebar

Open [docs/.vitepress/config.mjs](docs/.vitepress/config.mjs) and add an entry
to the relevant group in `sidebar`. Note that links here are **URL paths without
the `.md` extension**:

```js
{
  text: "Optimality",
  items: [
    { text: "Optimality in Practice", link: "/optimality" },
    { text: "Scalability", link: "/scalability" },   // new entry
  ]
},
```

To add a whole new top-level part of the book, append a new object with its own
`text` and `items` array. If the part should also be reachable from the top
navigation bar, add it to `nav` as well.

### 3. Add images, if any

Put image files in [docs/public/](docs/public/). Everything in that folder is
copied to the site root as-is, so reference them with a **root-relative path and
no `public/` prefix**:

```markdown
![](/my_diagram.png)
```

Images are clickable-to-zoom across the book via
`vitepress-plugin-lightbox`, which is wired up in `config.mjs` and applies
automatically. Nothing extra to do per image.

### 4. Check it locally, then push

Run `npm run docs:dev`, confirm the page renders and appears in the sidebar
where you expect, then commit and push.

---

## Publishing

The site is published at **https://ctoruno.github.io/data-analytics-workflows/**
and deploys automatically: every push to `master` triggers
[.github/workflows/deploy.yml](.github/workflows/deploy.yml), which installs
dependencies, runs `npm run docs:build`, and publishes `docs/.vitepress/dist`
to GitHub Pages. The workflow can also be run manually from the Actions tab.
There is nothing to deploy by hand, and the built site is not committed to the
repository (`docs/.vitepress/dist` is gitignored).

Two settings make the GitHub Pages URL work, and both are easy to break:

- **`base: "/data-analytics-workflows/"`** in `config.mjs`. The site is served
  from a subpath of `ctoruno.github.io`, not from a domain root, so every asset
  and link is prefixed with it. If the repository is ever renamed, this must be
  updated to match or every link on the site breaks.
- **[docs/public/.nojekyll](docs/public/.nojekyll)**, which stops GitHub Pages
  from running the output through Jekyll. Without it, Jekyll ignores the
  `assets/` files whose names begin with an underscore and the site loses its
  styling.

If a push does not show up on the site, check the Actions tab first: a failed
build leaves the previously deployed version in place, so the site keeps
working and the failure is silent from the outside.

## Contributing

Feedback, corrections, and suggestions are welcome via issues or pull
requests.

## License

This repository is licensed in two parts.

**The written guide** — everything under [docs/](docs/), including the images —
is licensed under
[Creative Commons Attribution-NonCommercial 4.0 International](LICENSE)
(CC BY-NC 4.0). You are free to share it and to adapt it, provided that you:

- **give credit**, naming the author, linking back to
  https://ctoruno.github.io/data-analytics-workflows/, indicating the license,
  and stating whether you made changes; and
- **do not use it commercially**, that is, for anything primarily directed
  toward commercial advantage or monetary compensation.

Example attribution:

> "Designing Data and Analytical Workflows" by Carlos A. Toruño P., licensed
> under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).
> Source: https://ctoruno.github.io/data-analytics-workflows/

**The code** — the sample snippets in the guide, the VitePress configuration
and theme under [docs/.vitepress/](docs/.vitepress/), and the build and
deployment scripts — is licensed under the [MIT License](LICENSE-CODE), so you
can lift a snippet into your own project without the non-commercial condition
attaching to your work.

### Commercial use

If you want to use this material commercially, in paid training, a course, a
consulting deliverable, or a published work, that is usually welcome, but it
needs a separate license. Open an issue or get in touch and we can arrange it.

Note that the license covers this text, not the ideas in it. Reading the guide
and applying these practices in your own work, paid or otherwise, requires no
permission at all.
