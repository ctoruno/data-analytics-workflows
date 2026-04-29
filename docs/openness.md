# Openness

The simplest framing of openness is this: make your code, your data (where possible), and your methodology publicly accessible. A workflow that lives behind an institutional login, depends on a proprietary tool, or simply was never shared with anyone outside the original team is not reproducible in any meaningful sense. It might be internally consistent, but that is a much weaker guarantee.

In practice, openness is not a binary. Not every project needs to be public from day one, and some projects involve data that simply cannot be shared. But the default posture matters. Starting with the assumption that your work will eventually be open tends to produce better habits: cleaner documentation, fewer hardcoded assumptions, more deliberate choices about tooling. The cost of openness is usually lower than it seems, and the benefits compound over time.

## Where to publish your code

It helps to think about publishing in layers, because different platforms serve different purposes and conflating them leads to common mistakes.

The first layer is your **_version control platform_**: Platforms such as [GitHub](https://github.com/) or [GitLab](https://about.gitlab.com/). These are your working environment. They track every change you make, let you collaborate with others, and manage different versions of your work in parallel. They are built for the process of doing the work.

::: info
**_Git is not GitHub/Gitlab_**

[Git](https://git-scm.com/) and GitHub/Gitlab are often used interchangeably, but they are different things. Git is a version control system: a tool that runs locally on your machine and tracks changes to your files over time. It has no dependency on the internet, on any company, or on any platform. You can use Git entirely offline, on a project that never leaves your laptop.

GitHub and GitLab are platforms that host Git repositories remotely. They add collaboration features on top of Git (pull requests, issue tracking, CI/CD pipelines), but they are not Git itself. They are services built around it.

This distinction matters for reproducibility. [Git](https://git-scm.com/) is the tool that makes traceability possible, it is the mechanism that records what changed, when, and why. GitHub/Gitlab is just one way to share and back up that record. The versioned history lives in Git; the platform is just a convenient home for it.
:::

<iframe width="100%" height="315" src="https://www.youtube.com/embed/QzvA7r-WndM?si=OLb7WUI_OBfCQ32N" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

For research projects, there are a few things to take into account about using a **_version control platform_** that are accurately flagged by some universities such as the [New York University's guide on research software](https://guides.nyu.edu/software-reproducibility/where-to-publish#:~:text=Harvard%20Dataverse%20is%20a%20free,proper%20citation%20for%20the%20code):

1. A GitHub URL is not a stable citation, and a repository can move, be deleted, or simply rot as dependencies and interfaces change around it. For research projects, having a stable copy in an archive that also assigns a Digital Object Identifier (DOI) to it is, in some cases, imperative. Using GitHub or Gitlab as your sole archival strategy is a common mistake, and an understandable one, but it is worth knowing what you are trading off.
2. GitHub is a commercial product, and they are NOT built for is long-term preservation. It makes no promises about keeping your repository accessible or usable indefinitely. 

The second layer is an **_archival repository_**: [Zenodo](https://zenodo.org/) or [Harvard Dataverse](https://dataverse.harvard.edu/) are the most widely used options. Their job is to take a snapshot of your work at a meaningful point in time, assign it a permanent DOI, and keep it accessible and citable for the long term. This is where you point someone when you want them to reproduce exactly what you did.

The workflow in practice is simple: you develop and collaborate on GitHub, and when you reach a meaningful milestone (a paper submission, a project release, a specific version you want to cite), you archive that version on Zenodo. [Zenodo even has a GitHub integration](https://help.zenodo.org/docs/github/) that makes this nearly automatic. For most projects, this two-layer combination is the right setup.

A third layer exists for research projects specifically: **_research hubs_** like the [Open Science Framework (OSF)](https://osf.io/). These sit above both of the previous categories. Rather than managing your code or archiving a specific artifact, a research hub ties the whole project together: your pre-analysis plan, your data, your code, your collaborators, and your outputs. The pre-registration feature is particularly valuable in scientific contexts, allowing you to publicly commit to your hypotheses and analysis plan before collecting data. OSF also assigns DOIs, integrates with GitHub and institutional storage, and gives you fine-grained control over what is public and what is private.

::: info
**_One honest disclaimer here_**: my experience with OSF is more limited than with the Zenodo+GitHub setup, so I can describe its purpose and architecture with more confidence than I can vouch for its day-to-day ergonomics.
:::

## Where to publish your data

Publishing data is a separate challenge, and one where the right answer depends heavily on context.

For general-purpose datasets, [Zenodo](https://zenodo.org/) and [Harvard Dataverse](https://dataverse.harvard.edu/) work here too. For machine learning datasets and models, [Hugging Face](https://huggingface.co/) has become the dominant platform, and [Kaggle](https://www.kaggle.com/) remains popular for team and competition-oriented sharing. [OpenML](https://www.openml.org/) is worth knowing if your focus is on benchmarking and model evaluation.

A few practical considerations that come up frequently:

*Field norms vary.* Depending on your discipline, there may be authoritative domain-specific repositories that are more appropriate (and more visible to your intended audience) than a general-purpose archive. [ICPSR](https://www.icpsr.umich.edu/sites/icpsr/home) is the standard for social science microdata, the [Gene Expression Omnibus](https://www.ncbi.nlm.nih.gov/geo/) for genomics data. A similar logic applies to institutional data catalogs: if you work for or in partnership with an organization that maintains a public data portal, publishing there is often expected, sometimes required, and tends to reach exactly the audience your data is meant for. The [World Bank Open Data catalog](https://datacatalog.worldbank.org/) or a national open data portal office are examples of platforms that carry institutional credibility and discoverability within their communities that a general-purpose archive cannot replicate. Their limitations are real though: you typically do not control the platform, versioning is inconsistent across catalogs, and metadata schemas are fixed by the institution. When in doubt, treat them as complementary rather than alternative: publish on the institutional catalog for visibility and credibility, and archive on Zenodo for the DOI and the long-term guarantee. It is worth checking what your field considers the appropriate home for data of your type before defaulting to a general platform.

::: info
**_What about data warehouses and data lakes?_**

You might be wondering why platforms like [Snowflake](https://www.snowflake.com/en/) or [Databricks](https://www.databricks.com/) are not mentioned here. The short answer is that they are a different category of tool entirely. Data warehouses and data lakes are operational infrastructure: they are where data lives and gets processed during active use, typically inside an organization and behind access controls. They are not designed for public sharing, long-term preservation, or citation.

This does not mean they are irrelevant to reproducibility. If your workflow reads from a data warehouse as its primary input, that is something you need to document carefully: which source, which table, which snapshot, which query. But the solution is not to "publish the warehouse", it is to capture that information as versioned metadata alongside your outputs. We will come back to this in the traceability section.

The platforms discussed here are specifically for publishing data to the world in an open, citable, and durable way. Those are two different problems, and they deserve different tools.
:::

*Format matters.* Publishing a dataset as an `.xlsx` file is technically open but practically hostile to anyone trying to use it programmatically. Prefer open, non-proprietary formats: CSV for small tabular data, Parquet for larger or more complex datasets. Parquet in particular has become the standard for analytical workflows because it handles column types explicitly, compresses well, and reads efficiently.

*Licensing matters.* Sharing data without a license is surprisingly common, and it creates real uncertainty for anyone who wants to reuse it. The copyright status of datasets is legally murky in many jurisdictions, which makes the CC0 dedication (effectively "no rights reserved") the cleanest choice when your goal is maximum reuse. If attribution matters to you, CC BY is the standard alternative. Without a clear license, even well-intentioned reuse becomes legally ambiguous.

*Some data cannot be shared at all.* If your workflow involves sensitive, confidential, or personally identifiable data, direct publication may simply not be an option. In that case, there are two practical tools.

First, data hashing: publishing a cryptographic fingerprint (typically SHA-256) of the input files allows others to verify that they are working with exactly the same data, without requiring the data itself to be public. We will come back to this in the traceability section. 

Second, synthetic data generation has matured substantially in recent years and can be a legitimate path to sharing something statistically useful without exposing real records. Restricted-access repositories like ICPSR offer a third route, where data is available to credentialed researchers under controlled conditions.

::: warning
**_Keep a copy of your data_**

If your workflow depends on an external data source, whether through an API, a public portal, or a direct download link, do not assume that source will remain accessible. In practice, APIs go offline, institutions restrict access, datasets get quietly revised, and portals disappear after funding cycles end. A workflow that cannot be reproduced because its input data is no longer available is not truly reproducible, regardless of how clean the code is.

The safest practice is to always keep a local or archived copy of every input dataset at the exact version your workflow used. This is especially relevant when working with APIs like CKAN, which power many government and institutional data portals: the data available today may not be the data available when someone tries to reproduce your work in two years.

There are real tensions here worth acknowledging. Some datasets are too large to store conveniently. Others come with licenses that restrict redistribution. In those cases, the minimum responsible practice is to record a cryptographic hash of the input data alongside your outputs, so that if the original source is ever accessible again, it can be verified. We cover this in more detail in the traceability section.
The general principle is simple: treat every external data dependency as a single point of failure, and plan accordingly.
:::

Finally, a framework worth knowing: the [**FAIR principles**](https://www.go-fair.org/fair-principles/) (Findable, Accessible, Interoperable, Reusable) have become the standard vocabulary for research data management. They do not prescribe specific tools, but they articulate the properties that well-published data should have. If you are working in a research context and need to make the case for better data publishing practices, FAIR is the language that organizations, funders, and reviewers increasingly speak.