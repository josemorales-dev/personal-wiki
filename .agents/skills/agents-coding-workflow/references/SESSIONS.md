# Sessions

Sessions for every project live in the hub, so one list shows every agent's work on this machine. Manage them with the `sessions` command; `sessions help` lists its commands. When `sessions` is not found, run `bun run link` in the hub's `.agents/tools/sessions/` to put it on `PATH`. When `sessions review` opens no Changes editor, run `bun run link` in the hub's `.agents/tools/vscode-review/` and ask the user to reload the worktree's VS Code window.

- Check: run `sessions list` before starting. When another session's scope overlaps the new work, tell the user before building.
- Start: run `sessions start <id> --repo <project> --tool <claude|codex>` before writing `PLAN.md`. It creates the worktree `<project>.worktrees/<id>` on branch `<id>` and the session folder `.agents/sessions/<id>/` in the hub. Write `PLAN.md` and `RESEARCH.md` in the folder, the draft in the worktree, and the approved change and its commits in the main checkout. When the project has uncommitted changes, `start` copies them into the worktree, uncommitted, and the review shows them with the draft; name those files when you ask for approval. In main, stage only the session's own changes.
- Track: record progress with `sessions update <id> --status <status>`. `start` sets `aligning`; set `awaiting-approval` at Approve, `building` at Build in main, `reviewing` at Review, `shipped` at Ship, and `blocked` when work stops on a blocker. `sessions finish` sets `done`. Record the approved plan's `Scope` paths with `--scope`, once per path.
- Finish: once the approved change is committed in main, move durable facts from the session into project memory or docs, then run `sessions finish <id> --discard-draft`. It removes the worktree and the draft branch and archives the folder. Commit the archived folder in the hub as `Archive the <id> session`.

Read [PLAN-FORMAT.md](PLAN-FORMAT.md) before writing a session plan or handoff.

Resuming a session: `sessions show <id>` gives its worktree and folder. Its `PLAN.md`, the draft in the worktree, and the Git history in main are the authoritative trail. Reconstruct state from them, continue from the handoff's `Next`, and re-run only the checks the remaining work touches.
