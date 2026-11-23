---
name: resolving-merge-conflicts
description: "Use when you need to resolve an in-progress git merge/rebase conflict."
---

Read [skill resource and project path rules](../PATHS.md) before applying this skill.

Use `agents-workflow` for approval and Git policy. Use
`agents-code-standards` and the applicable language standards while resolving
source files.

1. **See the current state** of the merge/rebase. Check git history, and the conflicting files.

2. **Find the primary sources** for each conflict. Understand deeply why each change was made, and what the original intent was. Read the commit messages, check the PRs, check original issues/tickets.

3. **Resolve each hunk.** Preserve both intents where possible. Where incompatible, pick the one matching the merge's stated goal and note the trade-off. Do **not** invent new behaviour. Always resolve; never `--abort`.

4. Discover the project's **automated checks** and run them — typically typecheck, then tests, then format. Fix anything the merge broke.

5. **Hand off the Git write.** After resolving and validating the files, stop.
   Do not stage, commit, or continue the merge/rebase. Report the exact
   non-destructive status and the commands the user can run to finish.
