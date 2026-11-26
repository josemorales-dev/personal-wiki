# Research: review session drafts in VS Code

- `.agents/tools/sessions/cli.ts:427` `difit` starts `bunx difit@5.0.12 . <base> --merge-base --include-untracked --background --no-open` in the worktree, records the server in `difit.json`, and opens the URL in Chrome.
- `.agents/tools/sessions/cli.ts:501` `finish` stops the recorded difit server through `stopSessionDifit` (`cli.ts:548`).
- `.agents/tools/sessions/cli.ts:285` `start` prints "difit shows them with the draft" after the carried files.
- `.agents/tools/sessions/session-store.ts:83` `saveDifit`, `loadDifit` and `forgetDifit` keep `difit.json` in the session folder. Nothing else reads that file.
- `.agents/tools/sessions/difit.ts` holds `startDifit`, `stopDifit`, `openInChrome` and `parseDifitServer`; `difit.test.ts` tests only `parseDifitServer`.
- `.agents/tools/sessions/main.ts:19` passes `startDifit`, `stopDifit` and `openInChrome` into the `Context`.
- `.agents/tools/sessions/sessions.test.ts:595` has the `difit` tests, `:819` to `:849` the finish tests for the difit server, and `:295` the carried-files message test.
- `.agents/skills/agents-coding-workflow/SKILL.md:22`, `:32`, `:34` and `:52` name difit and its comments. `AGENTS.md:40` says the plan and draft are approved "in difit".
- `start` creates the draft branch at the base and the draft stays uncommitted, so the worktree's `HEAD` is the merge-base of the draft and the base. VS Code's Source Control view diffs the working tree against `HEAD`, which matches difit's `--merge-base` diff, untracked files included.
- `code <folder> <file>` opens the folder in a window, reusing one that already shows it, and opens the file in that window. `code` 1.147.0 is on `PATH` at `/usr/local/bin/code`.
- The Claude Code VS Code extension is installed. With `/ide` connected, Claude sees the user's selection in VS Code, which replaces difit's line comments.
