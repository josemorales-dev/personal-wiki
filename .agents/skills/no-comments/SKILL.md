---
name: no-comments
description: Strip comments from a code change and turn the surprises they explain into clearer code. Use after drafting or writing code, or when asked to remove or audit comments.
---

# No comments

A fresh subagent hunts the comments; you vet its report and fix the code the comments were covering for.

## Scope

Use the files or diff the caller names. Otherwise use the comments the current change adds or edits: the working tree against the base branch, default `main`. Comments the change leaves untouched stay out of scope.

## Steps

1. **Hunt.** Spawn a `general-purpose` subagent. Give it the scope and the absolute paths of [references/HUNTER.md](references/HUNTER.md) and the `agents-code-standards` engineering standards, and tell it to follow `HUNTER.md`. Done when it returns its report.
2. **Vet.** Read its report and diff. Reject any edit to code rather than comments, any change outside the scope, any deleted comment that fits a keep exception in Self-Documenting Code, and any `MUST KILL` whose reason misstates the code. For a keep the hunter made on a thin `IMPORTANT` or `do not remove` claim, trace the claim yourself: read the symbol, then run `why` on it. Delete a keep the trace refutes or leaves ambiguous; restore a deletion only with an exact keep exception and proof. When a report fails vetting, revert it and rerun the hunter once, naming the failure; a second failure is reported open. Done when every deletion, keep, and flag is accepted or rejected.
3. **Fix.** Fix each accepted `MUST KILL` at its root, inside the scope: rename, extract, add a type, delete a dead path, drop a parameter, or call the real API so the code says what the comment said. When a fix changes types, signatures, or module shape, run `architect` once for the accepted set and its surrounding code, and stop at the sketch before fixing. Remove every named workaround; when the root cause lies outside the scope, land the smallest in-scope fix and report the rest open. Done when every accepted flag is fixed or reported open.
4. **Encode constraints.** A comment such as `do not remove`, `do not change wording`, or `talk to X before changing` states a constraint. Offer the cheapest in-scope encoding (a type, a runtime check, a test, or a lint rule) and wait for the user's answer. On a yes, encode it and delete the comment; otherwise delete the comment and report the constraint as unenforced. Done when every constraint comment is encoded or reported.
5. **Report.** Give the deletion count, restored comments, reruns, fixes, encodings, unenforced constraints, and other open work.
