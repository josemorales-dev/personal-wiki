---
name: architect
description: Sketch types, signatures, and module structure before writing code. Use when asked to architect or design a change, or before work that adds or reshapes types, interfaces, or modules.
---

# Architect

1. **Trace.** Find every system the change touches: callers, owners of the state involved, and the boundaries it crosses. Done when each touched module is named with a `path:line`.
2. **Sketch twice.** Sketch two genuinely different shapes as types, signatures, and module boundaries, using the vocabulary of `codebase-design`. For a large or contested design, run its Design It Twice process instead of sketching alone. Done when both sketches compile in your head down to their signatures.
3. **Pick.** Choose the shape where each piece of state has one owner, each task has one way to do it, and callers need to know least. When workarounds repeat, redesign rather than patch. Done when the choice and the reason it beats the other sketch are written down.
4. **Stay in the loop.** While the implementation fills in the sketch, revisit the shape whenever the code fights it, and update the sketch rather than working around it.
