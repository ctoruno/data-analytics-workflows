# Optimality

Optimality is the last of the three principles, and it should be honest about that position. Reproducibility and maintainability are not negotiable. Optimality often is. A workflow that is slow but correct, readable, and reproducible is a perfectly respectable piece of work, and there are plenty of situations where the right answer is to leave it alone.

The reason this section exists anyway is that "leave it alone" and "do not think about it" are different things. Optimality is about resources, and the resource budget is bigger than most people assume. It includes machine time, memory, and money, but it also includes your own time and the time of everyone who runs the workflow after you. The arithmetic I keep coming back to is this:

> **total cost = the time you spend writing it + machine time × number of runs + the time the next person spends understanding it**

That formula settles most arguments before they start. A pipeline that runs for forty minutes once a year is not a problem, no matter how inelegant it is. A script that takes forty seconds but that you rerun three hundred times while iterating on a model is a problem, even though forty seconds sounds harmless. The multiplier that almost nobody accounts for is the number of runs, and in analytical work the number of runs is dominated by development, not by production.

The same formula also explains why optimizing can be the wrong call. If a rewrite costs you two days and saves ninety seconds a year, you have made the workflow worse in the only unit that matters. And it explains why sometimes it is obviously the right call: two days spent making a pipeline skip work it has already done, saving ten minutes a day, pays for itself in a month and keeps paying.

## Measure before you optimize

Everyone knows the Knuth line about premature optimization being the root of all evil. Rather fewer people have read the sentence around it, which is specifically about programmers wasting time on the speed of noncritical parts of their programs. It was an argument against micro-optimizing code that does not matter. It was never an argument for ignoring the fact that your script reads the same two-gigabyte CSV file thirteen times.

I bring this up because in my experience "premature optimization" gets quoted as a defence of carelessness at least as often as it gets used correctly. There is a real difference between the two situations:

- **Premature optimization** is rewriting a loop in C++ because you have a feeling it might be slow, before you have any evidence that it is the bottleneck or that the bottleneck matters.
- **Carelessness** is a workflow that is slow for a reason you could have identified in five minutes, and that you never bothered to look at.

The line between them is measurement. If you have profiled the thing and know where the time goes, whatever you do next is a deliberate choice. If you have not, you are guessing, and the guess is usually wrong.

I am not going to walk through profiling tools here, because the mechanics are well documented and change more often than the ideas do. R has `profvis` and `bench`, Python has `cProfile` and friends, and both give you a flame graph or a table telling you where the time actually went. Learning one of them properly is a couple of hours well spent. What I will say is what those tools tend to reveal, because it is consistent enough to be worth stating in advance: in analytical work the bottleneck is almost never the arithmetic. It is reading and writing files, it is joins, and it is type coercion happening somewhere you did not ask for it. People come to profiling expecting to find a slow computation and find a slow `read_csv()` instead.

Hadley Wickham puts the stopping rule better than I can in [Advanced R](https://adv-r.hadley.nz/perf-improve.html). His advice is not to chase every bottleneck, because your time is better spent analysing the data than hunting inefficiencies: *"don't spend hours of your time to save seconds of computer time"*. The discipline he pairs it with is the part worth stealing. Decide, before you start, what counts as fast enough, and optimise only up to that number. Some bottlenecks will survive, and that is the intended outcome rather than a failure of nerve. Without a target you will keep going until you get bored, which is a worse stopping rule than any number you could have picked in advance.

## A hierarchy of wins

When something is genuinely too slow, there is a rough order of operations, sorted by how much you get back per unit of effort. It is worth having this list in your head, because the most common mistake is jumping to the bottom of it.

1. **Do less.** Filter and select before the expensive step, not after. Do not read columns you never use. Do not compute the thing you are not going to look at. This sounds too obvious to write down, and it is still where most of the available speedup lives.
2. **Fix the file format.** Moving from CSV to Parquet is the single largest cheap win available to most analysts. You get compression, column pruning, and preserved types, which means the fix is not only about speed. It also means the ID column with leading zeros stops silently becoming a number.
3. **Fix the obviously wrong pattern.** Growing an object inside a loop is the classic. Binding a row onto a data frame on every iteration reallocates the whole thing every time, which turns a linear job into a quadratic one. Collect the pieces into a list and bind once at the end. This one pattern accounts for a startling share of "R is slow" and "pandas is slow" complaints.
4. **Vectorize, or change the engine.** Let the underlying implementation do the loop for you, in whatever language it was actually written in.
5. **Cache.** Stop recomputing things that have not changed.
6. **Parallelize.**
7. **Rewrite the hot part in a compiled language.**

Most people reach for 6, and occasionally daydream about 7, without having seriously done 1 through 3. The first three steps are also the ones that make your code better by every other standard in this guide, which is not a coincidence. Reading only the columns you need is faster and clearer. Parallelizing is faster and harder to debug.

## Know what your engine is actually doing

If I had to name one thing that changed how I write data wrangling code, it would be understanding the difference between row-wise and column-wise processing, and noticing that the tools I use every day do not agree about it.

The short version: a traditional transactional database like Postgres stores data by row. All the fields of one record sit next to each other on disk, which is exactly what you want when the question is "give me everything about this one person". An analytical engine like DuckDB stores data by column. All the values of one variable sit next to each other, which is exactly what you want when the question is "what is the mean of this variable across ten million records", because you read that one column and touch nothing else. R's data frame, for what it is worth, has been column-oriented the whole time. A `data.frame` is a list of vectors, and a `tibble` is too.

Once that clicked, a lot of unrelated-looking behaviour turned out to be the same fact wearing different hats. Adding a column is cheap and adding a row is expensive. `rowwise()` in dplyr is slow not because it is badly implemented but because it is asking a columnar structure to work against its own grain. Postgres is superb at the query your web application makes and mediocre at the query your analysis makes. A `for` loop over rows in pandas is fighting the memory layout on every iteration.

The practical payoff is that you stop choosing tools by reputation and start choosing them by shape. If the operation is "one variable, many records", you want a columnar engine and you want to express the work as column operations. If the operation genuinely is per-record and cannot be vectorized, you should know that you are paying for it and decide whether the price is worth it. Most of the time, the per-record framing is a habit rather than a requirement, and rewriting it as a column operation is both faster and easier to read.

## The quiet revolution underneath

Something has been happening over the last few years that is easy to miss if you only look at the syntax you type: the engines under our dataframe APIs are being rewritten.

The clearest example is Polars, which is written in Rust and built on Apache Arrow, and which arrived fast enough to make the entire Python ecosystem reconsider some assumptions. The response from the incumbent is just as interesting. Pandas 3.0, released in January 2026, made a dedicated string type the default and backs it with Arrow when available, alongside copy-on-write becoming the only mode. That is pandas absorbing the same substrate rather than competing against it. DuckDB, written in C++, sits in the same family: a vectorized columnar engine that you embed rather than administer. And parts of the surrounding toolchain have gone the same way, which is why `uv` and `ruff` feel unlike the Python tools that came before them.

Nobody explains why this had to happen better than the person who wrote pandas in the first place. In [Apache Arrow and the "10 Things I Hate About pandas"](https://wesmckinney.com/blog/apache-arrow-pandas-internals/), Wes McKinney walks through the internals and lands on the memory layout as the root problem. A column of strings in pandas is an array of pointers to objects scattered across the process heap, and developers building on top of it are, in his words, *"hamstrung by the bloated, memory-bound nature of processing these objects"*. He notes that the three-letter string "wes" takes 52 bytes in Python. Arrow's answer is to lay each column out in contiguous memory so that scanning it costs no cache misses. That is the same fact from the previous section, applied one level lower: the reason the new engines are fast is that they took the columnar idea seriously all the way down to how bytes sit in RAM.

The pattern runs deeper than the tools an analyst touches directly. `pydantic` got its version 2 speedup from a Rust core, and `orjson` is the same story for serialization. There is a good write-up of this shift, [The Rust Revolution Inside Python Nobody Is Talking About](https://medium.com/@komalbaparmar007/the-rust-revolution-inside-python-nobody-is-talking-about-0b445be0d816), which argues that Python is settling into the role of orchestration language while Rust becomes the execution engine beneath it. The detail I find most telling is that in almost every one of these cases the Python-facing API did not change at all. The engine was swapped and most users never noticed.

I would not read this as a leaderboard. The useful takeaway for a practitioner is that **the interesting question is no longer which library you write in, it is which engine sits underneath the grammar you already know**. Those two decisions used to be welded together. They are increasingly separable, and that separation is good news for everything this guide argues for, because it means you can get large performance improvements without rewriting your analysis or retraining your team.

R has a particularly clean example of this. [duckplyr](https://duckplyr.tidyverse.org/) is a drop-in replacement for dplyr that routes your verbs to DuckDB's execution engine, and falls back to regular dplyr for anything it cannot translate. You keep writing `filter()`, `mutate()`, and `summarise()`. The work happens somewhere considerably faster, and it can read straight from files that do not fit in memory. It reached CRAN and joined the tidyverse organization in 2025, so it is no longer an experiment you have to justify to your team.

## Memory is the constraint that actually bites

For most analysts, the wall you hit first is not CPU. It is RAM, and the way you hit it is worth describing because it is so often misdiagnosed.

You rarely get a clean crash. What happens is that your session grows to fill available memory, the operating system starts swapping to disk, and everything becomes fifty times slower while continuing to work. The analyst concludes that R is slow, or that the dataset is too big, and starts looking for a distributed computing solution. The actual problem was six intermediate copies of the same data frame sitting in the global environment because every step of the pipeline was assigned to a new name.

Two habits fix most of this. The first is knowing how to ask how big things are, which both languages make easy. The second is being deliberate about types: a numeric column stored at double precision when it holds integers, or a repeated country name stored as free text rather than as a factor or category, costs multiples of what it needs to.

And then there is the option nobody likes to put in writing. **Sometimes the correct optimization is to buy more RAM, or to rent a bigger machine for an afternoon.** If a cloud instance for a few hours costs less than a rounding error on your salary, and the alternative is two days rewriting a working pipeline to process data in chunks, the arithmetic from the top of this section is unambiguous. Engineers tend to find this answer distasteful. For analytical work it is very often correct, and pretending otherwise is its own kind of waste.

## Larger than memory, without leaving your language

When the data genuinely does not fit, the good news is that the escape hatch no longer requires a cluster or a new career.

The pattern that has become the default answer is Parquet files on disk queried by DuckDB. You do not load the data. You describe the query, the engine reads only the columns and row groups it actually needs, and you get back a result that does fit in memory. The mechanism underneath is lazy evaluation: nothing runs when you write the verbs, an execution plan is assembled, and the engine pushes your filters and column selections as far down toward the storage as it can before any data moves.

The important part is that you do not have to abandon the grammar you know to use it. In R, duckplyr and `dbplyr` both let you keep writing dplyr. In Python, Polars has a lazy API and DuckDB will happily query a dataframe or a directory of Parquet files directly. This is the single highest-leverage thing an analyst working with awkwardly large data can learn, and it takes an afternoon rather than a quarter.

## Caching, and its dangers

Not recomputing what has not changed is where efficiency stops being about speed and starts being about workflow design.

Finding [targets](https://docs.ropensci.org/targets/) was a genuine turning point in how I work. You declare your pipeline as a set of named steps with explicit inputs, and it works out what is stale and reruns only that. The obvious benefit is time. The less obvious benefits turned out to matter more: the dependency graph forces you to name every intermediate object and every relationship between them, which is a modularity discipline disguised as a performance tool, and the record of what ran and what produced what is exactly the audit trail that [traceability](./traceability.md) asks for. It is a rare case of a tool that makes a workflow faster, more modular, and more traceable at once. Python does not have a single equivalent with the same cultural weight, but the space is well served between `joblib`'s memoization for function-level caching and Snakemake for pipeline-level orchestration.

The warning matters as much as the recommendation, because caching is the one optimization that can quietly produce wrong answers. Hand-rolled caching of the form "if the output file already exists, skip this step" has no notion of invalidation. It does not know that the input changed, or that you edited the function. It will serve you a stale result forever, silently and quickly. **A stale cache is worse than a slow pipeline**, because a slow pipeline only wastes time. This is precisely why `targets` earns its complexity: it hashes inputs and code rather than trusting you to remember what you changed.

There is a related tension worth naming outright, because this guide has spent a lot of pages arguing for reproducibility and this section could be read as permission to undermine it. Caching, incremental runs, and skipping unchanged steps all increase the chance that the numbers you published were never produced by a single clean run from a cold start. The position I would defend is that the cold run must remain possible and must actually be exercised: before a release, on a schedule, or in CI. Incremental execution is for the development loop. The full run is what you trust.

## Parallelism, honestly

Parallelism is genuinely useful in analytical work, and it is useful in a narrower set of cases than people expect.

Where it pays is embarrassingly parallel work: the same operation repeated over independent units. In practice this means running the same routine for every country, fitting fifty model specifications, running five hundred bootstrap replicates, or hitting an API a few thousand times. These are the cases where the work splits cleanly and nothing needs to talk to anything else.

The distinction worth internalizing is between work that is waiting and work that is computing. If your job is I/O bound, which describes almost all API calls and file downloads, you need concurrency and threads are enough. If your job is CPU bound, you need actual separate processes, and in Python that distinction is the whole reason the GIL comes up in every conversation.

The failure modes are less discussed than the benefits:

- **Oversubscription.** Many modern libraries are already multithreaded. Wrapping a parallel loop around code that is itself using every core produces contention and can be slower than the serial version. This is easy to do accidentally.
- **Memory multiplication.** Four worker processes can mean four copies of your data. The parallel version of a job that barely fit in memory does not fit at all.
- **Debugging.** Errors inside workers surface badly, or not at all. Develop serially, keep a switch that runs everything in a single process, and turn parallelism on last.

### A word about Spark

Spark deserves its own mention, partly because it is the tool people reach for when they decide their data is Big, and partly because I like working with it and still think it is usually the wrong first answer.

What Spark is genuinely good at is distributed computation across a cluster, on data that does not fit on one machine, with fault tolerance built in for jobs long enough that a node dying mid-run is a realistic concern. If you are in an organization that already runs a cluster, PySpark is a pleasant way to work and the ecosystem around it is mature.

What Spark is not good at is being small. There is a real fixed cost to a Spark job: the JVM, the session, the serialization, the scheduling. For datasets in the range most analysts actually work with, that overhead dominates and a single-node columnar engine will beat it comfortably, on a laptop, with no cluster to maintain. I have been on both sides of this. **My honest experience is that most of the times I reached for Spark, what I actually needed was a better DuckDB implementation.** Usually the real problem was that I was reading CSV instead of Parquet, or filtering after the join instead of before it, and no amount of distribution fixes a query plan you never thought about.

I am not alone in this, and there is now evidence rather than just war stories. Jordan Tigani, who spent years building BigQuery at Google before founding MotherDuck, argued in 2023 that big data was mostly irrelevant to how people actually work, then went back and tested the claim against real numbers. AWS had released a dataset covering half a billion Redshift queries across 32 million tables over three months, and his follow-up post, [Redshift Files: the Hunt for Big Data](https://motherduck.com/blog/redshift-files-hunt-for-big-data/), works through it. Roughly three queries in ten thousand scan more than 10 TB. About one user in six hundred has ever run one. Even inside organizations that genuinely do hold big data, the overwhelming majority of their queries hit smaller tables anyway. His summary of what the numbers imply is the line worth remembering: *"93% of users probably would have been fine processing their data on their laptop"*.

One practical note for R users: SparkR, the R API maintained by the Spark project itself, was deprecated in Spark 4.0, and [sparklyr](https://spark.posit.co/) is now the recommended R interface. It was always the more comfortable option for people who think in dplyr, and it is now the only one with a future.

## Scalability is efficiency extended into the future

Everything above is about the workflow you are running today. Scalability is about the workflow you will still be running in two years, and the first thing to get right is what "growth" actually means in our line of work.

The industry conversation is about data volume, and for most analytical teams that is the least relevant axis. In my experience growth arrives in this order:

1. **More units of analysis.** Thirty countries becomes a hundred and forty. Three survey waves becomes twelve. One index becomes six. The rows per unit barely move, but the number of times you have to do the whole thing multiplies.
2. **More consumers.** The workflow starts as something you run, becomes something your team runs, and eventually feeds something the public sees.
3. **More rows.** Eventually, sometimes, and usually less dramatically than anticipated.

Almost all the scalability pain I have seen in policy and research analytics comes from the first two, and almost all the scalability advice available online is written about the third. That mismatch is worth naming, because it sends people shopping for distributed computing when what they actually needed was a function with an argument.

### The hardcoding ceiling

The thing that breaks when the number of units grows is not performance. It is every assumption you baked in when there were only three of them.

You know the symptoms. The country list written inline in four different scripts. The column names spelled out in forty places. `01_clean_country_A.R` sitting next to `01_clean_country_B.R`, identical except for a string. The sheet name, the survey year, the magic number for the current wave. None of this is slow. All of it means that adding the fourth unit costs the same as adding the first three, forever.

The rule I would offer is deliberately blunt: **anything that appears in a file name should probably be an argument instead.** This is the same discipline as [parameterizing the decisions](./modularity.md#interfaces-parameterize-the-decisions), arriving from the direction of growth rather than the direction of structure. Once the unit is an argument, running the workflow over all of them is a mapping operation and a configuration file, and adding the hundred and fortieth costs nothing.

### Schema fragility

The second ceiling is logic that only works on the exact data you received this time.

Positional selection is the usual culprit. Referring to the third column, or slicing columns five through twelve, encodes an assumption about column order that nothing enforces and that an upstream Excel export will eventually violate. It will not error. It will produce plausible numbers from the wrong columns, which is the worst possible failure mode and one that [observability](./observability.md) exists to catch. Select by name, or by predicate, and validate the schema at the boundary.

There is also a shape argument here that is usually made on tidiness grounds and deserves to be made on scalability grounds. Long data survives growth better than wide data. If each year is a column, every new year is a schema change and every function that touches the data has to learn about it. If each year is a value in a column, a new year is just more rows, and nothing downstream needs to know.

### Know where your exit ramp is

For the analytical layer, there is a reasonably well-defined ladder: in-memory dataframes, then a faster single-node engine like data.table or Polars, then DuckDB over Parquet for data larger than memory, and then, if you genuinely need it, a warehouse or a cluster.

This guide deliberately stops before the last rung, since that territory belongs to data infrastructure rather than analysis. But two things are worth saying about it. The first is that **most analysts should stop at DuckDB**, and the decision to go further is usually organizational rather than analytical. The second is that scalability, as a design philosophy, is mostly about making the next rung cheap to climb rather than climbing it in advance.

Concretely, that means keeping transformation logic in functions that accept a table-like object rather than in scripts that assume a specific in-memory type, and favouring interfaces that let you defer the backend decision. duckplyr and `dbplyr` in R, and `ibis` in Python, all exist so that the same code can run against different engines. You do not need to use them today to benefit from writing code that could.

### Human scalability

The dimension that the standard definition ignores entirely is the one that has caused me the most trouble: whether the workflow scales to more people.

A pipeline that only runs correctly when you run it does not scale, regardless of how much data it handles. If the sequence of steps lives in your head, if there is a manual fix at the end that you always remember and nobody else knows about, if onboarding a new analyst means a week of shadowing, then the workflow has a hard ceiling at exactly one person. I have supervised enough junior analysts to have watched this ceiling get hit in both directions: sometimes their code could not be picked up by anyone else, and sometimes, more uncomfortably, mine could not.

This is where optimality loops back into maintainability, and it is why I do not think of them as separate concerns in practice. The documentation, the modular structure, the logging, the tests: all of them are scalability infrastructure for the human side of the workflow. The bus factor is a performance metric.

### When not to scale

All of which needs a counterweight, because taken too far this section becomes a mandate to generalize everything, and that is its own failure.

Plenty of analysis is genuinely one-off. A question comes in, you answer it, nobody asks again. Building a parameterized, configurable, engine-agnostic pipeline for that is a waste of the most expensive resource in the formula. The rule of three is a decent heuristic: write it directly the first time, tolerate the duplication the second time, generalize on the third, when you have enough information to know what actually varies.

The real hazard is not writing throwaway code. It is that **throwaway code is almost never thrown away**. A remarkable amount of what runs in production at analytical organizations is exploratory code that nobody ever demoted. It got a nice name, someone else started depending on it, and eight months later it is load-bearing. The cheap defence is structural: keep exploratory work in a clearly marked scratch area, so that promoting something into the pipeline is a deliberate act rather than a thing that happens by neglect.

---

That is the whole argument. Optimality is not about speed, it is about proportionality, and the resource you are most likely to waste is not compute. It is attention: yours, spent optimizing things that did not matter, or your successor's, spent understanding a workflow that was never designed to be run by anyone else.

Taken together, the three principles in this guide are three kinds of respect. **Reproducibility** respects the people who need to trust your results. **Maintainability** respects the people who will read your code, including you. **Optimality** respects the resources it takes to run the thing at all. None of them is about writing clever code. All of them are about writing code that is still useful after you have moved on to the next question.