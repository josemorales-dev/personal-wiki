# Session manager

## Task 1: Build the `sessions` CLI

- Status: not started
- Goal: Agents start, track, list, and finish sessions from one hub-wide store, each session in a sibling worktree of its project repository.

Notes:

- TypeScript on Bun 1.3.12 with no runtime dependencies. `bun add -d typescript @types/bun` adds the dev dependencies and writes `bun.lock`, so the versions are whatever is current at install time.
- State lives in the hub: active sessions in `.agents/sessions/<id>/`, archived ones in `.agents/archive/sessions/<id>/`. Each session writes only its own `session.json`, by writing a temporary file and renaming it, so parallel agents never conflict. Claiming an id is an exclusive `mkdir`.
- The hub root comes from the script's own location through `git rev-parse --git-common-dir`, so a copy inside a hub worktree still uses the main checkout's state.
- Worktrees go in `<repo>.worktrees/<id>`, beside the project's main checkout, on a new branch `<id>`.
- `finish` only removes a worktree whose branch is merged into its base, and it uses `git worktree remove` and `git branch -d`, which refuse to discard work. Discarding unmerged work stays a manual, guarded step.
- CLI practice: help with examples on every command, `--json` for agents, color only on a TTY without `NO_COLOR`, errors on stderr with a hint, exit codes 0 for success, 1 for failure, 2 for usage. No prompts, because agents run it non-interactively.
- Known limitation: a squash-merged branch is not an ancestor of its base, so `finish` refuses it. The hint tells the agent to clean up by hand.
- This session runs in the hub's main checkout, because the tool it builds does not exist yet.

Scope:

| Path | Change |
| ---- | ------ |
| `.agents/tools/sessions/session.ts` | Session type, statuses, tools, parsers, scope overlap. |
| `.agents/tools/sessions/session-store.ts` | Hub store: claim, save, load, list, release, archive. |
| `.agents/tools/sessions/worktree.ts` | Git operations: main checkout, current branch, add, merged, remove, prune, delete branch. |
| `.agents/tools/sessions/report.ts` | Colors, tables, relative ages. |
| `.agents/tools/sessions/cli.ts` | Commands `start`, `list`, `show`, `update`, `finish`, and help. |
| `.agents/tools/sessions/main.ts` | Entry point: resolves the hub, detects color, runs the CLI. |
| `.agents/tools/sessions/sessions.test.ts` | Tests at the `run` seam against real Git repositories in temporary folders. |
| `.agents/tools/sessions/package.json`, `tsconfig.json` | Bun package with `test`, `typecheck`, and `check` scripts; strict compiler settings. |
| `.gitignore` | Ignore live session state and the tool's `node_modules`. |

Seams:

| Interface | Behaviour the tests observe |
| --------- | --------------------------- |
| `run(argv, context)` in `cli.ts` | Exit code, stdout, and stderr for each command, plus the worktrees, branches, and archive it leaves behind. The context injects the hub folder, the clock, color, and output streams. |

Steps:

1. Create the package files, then run `bun add -d typescript @types/bun` in `.agents/tools/sessions/`.
2. Build the slices in `SCRATCH-TESTS.md` order, one test to green at a time, with the code in `SCRATCH-CODE.md`.

Checks:

- `bun test` in `.agents/tools/sessions/` shows every test passing.
- `bun run typecheck` in `.agents/tools/sessions/` shows no errors.
- `bun .agents/tools/sessions/main.ts help` prints the command list, and `bun .agents/tools/sessions/main.ts list` prints "No active sessions." against the real hub.

## Task 2: Wire the workflow to the CLI

- Status: not started
- Goal: The workflow, `AGENTS.md`, and `PATHS.md` send every session through `sessions`, and the controls table is gone.

Scope:

| Path | Change |
| ---- | ------ |
| `AGENTS.md` | One line under Planning: sessions live in the hub, each with a sibling worktree. |
| `.agents/skills/agents-coding-workflow/SKILL.md` | Session paragraph becomes start, track, check, finish with `sessions`; project state drops the archive and controls lines. |
| `.agents/skills/PATHS.md` | Session state is the exception that lives in the hub. |
| `.agents/skills/agents-coding-workflow/references/CONTROLS-FORMAT.md`, `.agents/CONTROLS.md` | Deleted. |

Steps:

1. Apply the documentation changes in `SCRATCH-CODE.md`.
2. Archive this session by hand, since it predates the tool: move its folder to `.agents/archive/sessions/session-manager/` and delete `.agents/CONTROLS.md`.

Checks:

- `grep -rn 'CONTROLS' AGENTS.md .agents/skills` shows no matches.
- `grep -n 'sessions start' .agents/skills/agents-coding-workflow/SKILL.md` shows one match.
