# Review without the sidebar

## Task 1: close the sidebar instead of opening Source Control

- Status: in progress
- Goal: `sessions review <id>` shows the Changes editor and `PLAN.md` with the primary sidebar closed.

Notes:

- `git.viewChanges` and `git.viewStagedChanges` take the repository as an argument, so they never needed the Source Control view open.
- Known limitations from the draft review:
  - Only the primary sidebar closes; the secondary sidebar and the bottom panel keep their state.
  - When Git opens no repository or `git.viewChanges` fails, the warning shows and the sidebar stays as it was.
  - On a new window, the restored sidebar may show briefly while Git loads.
  - No automated test covers the command sequence; the manual check does.
- The extension is linked from the main checkout into `~/.vscode/extensions`, so only the change in main runs in VS Code; the manual check runs after the build, with a window reload.

Scope:

| Path | Change |
| --- | --- |
| `.agents/tools/vscode-review/extension.js` | Drop `workbench.view.scm`; run `workbench.action.closeSidebar` after the Changes editor opens. |
| `.agents/tools/vscode-review/package.json` | Describe the closed sidebar instead of Source Control. |
| `.agents/tools/sessions/cli.ts` | `sessions review` help names the closed sidebar instead of Source Control. |

Steps:

1. Apply the three edits.

Checks:

- `bun test` in `.agents/tools/vscode-review` and `.agents/tools/sessions` passes.
- `bunx tsc --noEmit -p .agents/tools/sessions` reports no errors.
- After a window reload, `sessions review` opens the Changes editor and `PLAN.md` with no sidebar, in a new window and in one already open.
