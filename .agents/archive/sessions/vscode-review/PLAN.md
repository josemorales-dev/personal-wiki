# Review session drafts in VS Code

## Task 1: replace difit with VS Code for session review

- Status: in progress
- Goal: `sessions review <id>` opens the session worktree and its `PLAN.md` in VS Code, which then shows Source Control and the Changes editor with the draft's diff, whether or not the window was already open.

Notes:

- The `code` command cannot run VS Code commands, so the local `vscode-review` extension does. In a folder whose parent ends in `.worktrees`, it waits up to 30 seconds for Git to open that folder's repository, loads its status, shows Source Control, and runs `git.viewChanges`, plus `git.viewStagedChanges` when the index has changes. It does this on start-up and whenever it receives `vscode://local.vscode-review/show-changes`, which `sessions review` sends with macOS `open` after `code`, so a window that is already open shows the Changes editor too. Manual tests on 2026-11-25 confirmed both paths.
- On a failure the extension shows a warning naming the reason, such as Git opening no repository.
- The extension installs as the symlink `~/.vscode/extensions/local.vscode-review`, the only install outside the hub. A packaged `.vsix` install failed on VS Code's restart guard, and the symlink picks up edits on reload.
- The diff is against the worktree's `HEAD`, which is where the draft branched off the base, so the draft must stay uncommitted.
- The per-file diff tabs and base copies tried earlier are dropped at the user's request.
- Review comments arrive in chat. Whether `/ide` passes selections from the worktree's window to a session started in the hub is unverified, so the skill does not rely on it.
- With no server, `difit.json`, the stop on `finish`, and the Chrome launcher all go.

Scope:

| Path | Change |
| --- | --- |
| `.agents/tools/vscode-review/package.json`, `.agents/tools/vscode-review/extension.js`, `.agents/tools/vscode-review/session-worktree.js`, `.agents/tools/vscode-review/extension.test.js` | New. The extension, its manifest with a `link` script, `isSessionWorktree`, and its test. |
| `.agents/tools/sessions/editor.ts` | New. `openReview(worktree, plan)` runs `code <worktree> <plan>`, then `open vscode://local.vscode-review/show-changes`. |
| `.agents/tools/sessions/difit.ts`, `.agents/tools/sessions/difit.test.ts` | Delete. |
| `.agents/tools/sessions/cli.ts` | Replace the `difit` command with `review`; drop the difit stop from `finish`; reword the carried-files note in `start`. |
| `.agents/tools/sessions/session-store.ts` | Drop `saveDifit`, `loadDifit`, `forgetDifit`. |
| `.agents/tools/sessions/main.ts` | Pass `openReview` instead of the difit and Chrome functions. |
| `.agents/tools/sessions/sessions.test.ts` | Replace the difit tests with review tests; drop the finish tests for the difit server. |
| `.agents/skills/agents-coding-workflow/SKILL.md`, `AGENTS.md` | Name VS Code, `sessions review`, and the extension in place of difit. |

Seams:

| Interface | Behaviour the tests observe |
| --- | --- |
| `run(["review", id], context)` | Calls `context.openReview` with the worktree and `PLAN.md`, and prints both paths and where the changes show. |
| `run(["review", id], context)` with a failing editor | Exits 1 with the editor's error. |
| `run(["review", id], context)` with a missing worktree, a missing `PLAN.md`, or an unknown id | Exits 1 without opening the editor. |
| `run(["start", ...], context)` with carried files | Says the review shows them with the draft. |
| `isSessionWorktree(folder)` | True only for a folder directly inside a `.worktrees` folder. |

Steps:

1. Add the extension and `editor.ts`, and wire `openReview` through `Context` and `main.ts`.
2. Replace the `difit` command with `review` in `cli.ts`, and remove the difit server code from `cli.ts` and `session-store.ts`.
3. Delete `difit.ts` and `difit.test.ts`.
4. Rewrite the affected tests in `sessions.test.ts`.
5. Update `SKILL.md` and `AGENTS.md`.
6. After the build, run `bun run link` in the main checkout's `.agents/tools/vscode-review/` so the link stops pointing at the worktree.

Checks:

- `bun run check` in `.agents/tools/sessions` shows the typecheck clean and every test passing.
- `bun test` in `.agents/tools/vscode-review` passes.
- `grep -rni difit AGENTS.md .agents/skills .agents/tools --exclude-dir=node_modules` prints nothing.
- `sessions review vscode-review` shows Source Control and the Changes editor, both in a new window and in one that is already open.
