# Idiomaticity

Every programming language has a culture: conventions, patterns, and idioms that experienced practitioners converged on because they work well in that ecosystem. Idiomatic code is code that feels native. It uses the language's strengths deliberately, follows the community's conventions, and avoids patterns that are technically valid but foreign.

This is also the easiest of these principles to weaponize. "That is not idiomatic" is nearly unfalsifiable, and most of the time it means "that is not how I would have written it." So it is worth having a test that is not taste. The one I would offer: an idiom earns the status of a principle when breaking it costs the next reader in that ecosystem real effort, or when it costs the machine something. Everything else is a preference, and preferences do not get to be principles.

## When an idiom is more than a preference

The clearest case is when the same pattern has different consequences in two languages.

Take building up a result inside a loop by appending to it one element at a time. In Python, a list is designed for exactly that, appending is cheap, and the loop is close to what you should write. In R, doing the equivalent by concatenating onto a vector reallocates the entire vector on every iteration, so the cost grows quadratically with the length of the loop. Same shape, same intent, and one of the two is a performance bug that gets worse as the data gets bigger. The R answer is to preallocate, or better, to stop looping and think in terms of whole vectors.

No style guide will tell you this. It is not a formatting question, and that is exactly why idiomaticity belongs among the principles rather than in the section on [style guides and formatters](./readability.md#style-guides-formatters-and-linters).

The deeper asymmetry behind that example explains most of what goes wrong when people move between the two languages. R's fundamental unit is the vector, and vectorization is a property of the language itself. Python's fundamental unit is the object with methods, and vectorization lives in libraries rather than in the language. So an R user gets vectorized thinking for free and quietly loses it the moment they write pure Python, while a Python user has to acquire it deliberately in order to write decent pandas or polars. In my experience, most of the awkward cross-language code I have read traces back to that one difference rather than to anything about syntax or naming.

## R has dialects, Python has a convention

In Python, "be idiomatic" is a following instruction. PEP 8 exists, the culture enforces it, and the ecosystem is coherent enough that the advice is close to actionable on its own.

In R it is a choosing instruction. Base R, the tidyverse, and data.table are three internally coherent dialects that genuinely disagree about what good code looks like, and no authority sits above them to settle it. You cannot be idiomatic in R without first picking one, which makes the same instruction a judgment call rather than a lookup.

My default is the tidyverse, for the reason given in the readability section: it has enough gravity that it reads as normal to most people, and its grammar is easier for a newcomer to follow than base R subsetting. But I want to be honest about what that costs, because the [portability section](./portability.md) already made the strongest argument against it without framing it that way. The deprecation example used there, the scoped verbs giving way to a newer interface, is real API churn in the dialect I am recommending, and it is not the only instance. Base R has deprecated almost nothing in twenty years. So the trade is coherent grammar and readability against a moving target, and it looks different for an analysis that ships in six weeks than for code somebody needs to run in 2032. data.table sits somewhere else again: a very stable interface, excellent performance, and a syntax that is genuinely harder to read if you have not committed to learning it.

One more disclosure, since it is visible throughout this guide. My own code is not idiomatic tidyverse. I namespace functions explicitly rather than attaching packages, and I use the native pipe rather than the magrittr one. That is a package development idiom carried into analytical work, and it follows directly from the recommendation to [package your code](./r_reproducible_workflow.md). It is a dialect, chosen for a reason, and I would rather name it than pretend it is the neutral default.

## Objects, patterns, and where instincts diverge

Two things promised earlier belong here, and both are shorter than the promise suggested.

The first is why reaching for a class feels obvious in Python and unusual in R, which the [modularity section](./modularity.md#functions-and-classes) left open. Python has one object model, taught early, with clean syntax. R has several, none of which is the canonical one, and its culture is functional-first because its original audience was statisticians rather than software engineers. The practical consequence is that the default container for shared context is a class in Python and a list of functions or a closure in R. Neither is wrong. If you do want what a Python developer means by a class, R6 is the honest answer today, and S7 is where the ecosystem appears to be heading.

The second is design patterns, and my position is probably contrarian. Most of the classic patterns dissolve in these two languages. A singleton is a module, a strategy is a function argument, a factory is a function, a decorator is syntax. Their value is vocabulary rather than implementation: being able to tell a colleague "that is a strategy" in three words is worth something, and drawing the diagram is not. Learn the names, skip the ceremony.

::: info
**_Idiom is the thing AI tools are worst at_**

I have recommended coding assistants twice in this chapter, for documentation and for function-level comments, and this is the fair counterweight. Idiom is structurally the hardest thing for these models to get right, because they generate something close to the average of a corpus and the corpus mixes dialects. So you get both pipe operators in the same file, a base R subset dropped into the middle of a dplyr chain, or pandas code that iterates row by row because a great many Stack Overflow answers did. It runs, it passes review, and it reads as though three different people wrote it. Worth reading generated code specifically for consistency of dialect, since that is the failure mode you should expect rather than incorrectness.
:::

---

Of the four sub-principles in this chapter, this is the one where being wrong costs least, and I would rather say so than inflate it. Badly factored code is a real problem. **Non-idiomatic but clear code is a tax.** You pay it in the small friction of every future reader adjusting to a foreign accent, which is worth avoiding but is not in the same category as a three-hundred-line function.

Which points at the one good reason to break idiom deliberately: your actual readers. Hyper-idiomatic R full of functional programming helpers and metaprogramming is worse code if the people maintaining it are economists who learned to program in Stata. Idiomaticity exists to serve readability, so on the rare occasion the two conflict, the person who has to read it wins.

That closes the maintainability chapter, and it closes it on a question of cost, which is the natural handoff to the next one. Everything here has been about the cost of code to the humans around it. Optimality is about its cost to the machine, and about the fact that those two budgets are not always spent in the same direction.
