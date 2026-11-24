# Review session drafts in difit

## Task 1: add `sessions difit <id>`

- Status: not started
- Goal: `sessions difit <id>` opens difit on the session worktree's changes against the session base and prints the port the agent uses to read comments.

Notes:

- The command runs `bunx difit@5.0.12 . <base> --merge-base --include-untracked --background` in the worktree. That diff covers committed, uncommitted, and untracked changes. A manual run on 2026-11-24 confirmed it.
- difit takes the next free port when its port is busy, so the command prints the port it gets.
- `Context` gets a `startDifit` function, so tests check the arguments without starting a server.

Scope:

| Path                                       | Change                                           |
| ------------------------------------------ | ------------------------------------------------ |
| `.agents/tools/sessions/cli.ts`            | `difit` command, `startDifit` in `Context`, help |
| `.agents/tools/sessions/main.ts`           | real `startDifit` that spawns difit              |
| `.agents/tools/sessions/sessions.test.ts`  | tests for `difit`, `finish`, and `check-format`  |

Seams:

| Interface                  | Behaviour the tests observe                                                          |
| -------------------------- | ------------------------------------------------------------------------------------ |
| `run(["difit", id], ctx)`  | calls `startDifit` with the worktree and the difit arguments, then prints URL and port |
| `run(["difit", id], ctx)`  | fails with a hint when the worktree is missing or difit fails to start               |

Checks:

- `bun test sessions.test.ts` passes the new `difit` tests, and they fail before the change.

## Task 2: limit `check-format` to PLAN.md

- Status: not started
- Goal: `sessions check-format <id>` checks PLAN.md alone, and the scratch rules are gone.

Scope:

| Path                                          | Change                                     |
| --------------------------------------------- | ------------------------------------------ |
| `.agents/tools/sessions/format-check.ts`      | drop scratch checks and the Scope match    |
| `.agents/tools/sessions/format-check.test.ts` | drop scratch tests, keep PLAN.md tests     |

Seams:

| Interface                    | Behaviour the tests observe                       |
| ---------------------------- | ------------------------------------------------- |
| `checkSessionFormat(read)`   | reports PLAN.md problems and ignores other files  |

Checks:

- `bun test format-check.test.ts` passes, including a session folder that has only PLAN.md.

## Task 3: let `finish` discard an unmerged draft

- Status: not started
- Goal: `sessions finish <id> --discard-draft` removes an unmerged draft worktree and its branch, and plain `finish` keeps refusing an unmerged branch.

Notes:

- The approved change lands in the project's main checkout, so the draft branch is never merged. `--discard-draft` runs `git worktree remove --force` and `git branch -D`.

Scope:

| Path                                | Change                               |
| ----------------------------------- | ------------------------------------ |
| `.agents/tools/sessions/worktree.ts` | force variants of remove and delete |

Seams:

| Interface                                     | Behaviour the tests observe                                   |
| --------------------------------------------- | ------------------------------------------------------------- |
| `run(["finish", id, "--discard-draft"], ctx)` | removes a dirty, unmerged worktree and branch, then archives  |

Checks:

- `bun test sessions.test.ts` passes the new `finish` test, and it fails before the change.

## Task 4: rewrite the workflow around the draft

- Status: not started
- Goal: the coding workflow drafts the change in the worktree, gets approval in difit, then rebuilds it test-first in the project's main checkout.

Scope:

| Path                                                             | Change                                     |
| ---------------------------------------------------------------- | ------------------------------------------ |
| `.agents/skills/agents-coding-workflow/SKILL.md`                 | loop steps, sessions bullets, resume text  |
| `.agents/skills/agents-coding-workflow/references/SCRATCH-FORMAT.md` | delete                                 |
| `AGENTS.md`                                                      | Planning paragraph                         |

Checks:

- `grep -rn -i scratch AGENTS.md .agents/skills/agents-coding-workflow .agents/tools/sessions --exclude-dir=node_modules` prints nothing.
- `bun run check` in `.agents/tools/sessions` passes.
