# Act on the difit-review retro

## Task 1: add `sessions land <id> <path>...`

- Status: not started
- Goal: `sessions land` copies draft paths from the session worktree into the main checkout, so a unit lands one file at a time.

Notes:

- A path the draft deleted is deleted in main. A path missing on both sides is an error, and nothing lands.
- Paths are repository-relative and parsed like `--scope` paths.

Scope:

| Path                                      | Change                       |
| ----------------------------------------- | ---------------------------- |
| `.agents/tools/sessions/cli.ts`           | `land` command and help      |
| `.agents/tools/sessions/sessions.test.ts` | tests for every task's CLI change |

Seams:

| Interface                         | Behaviour the tests observe                                        |
| --------------------------------- | ------------------------------------------------------------------ |
| `run(["land", id, ...paths], ctx)` | main holds the draft's content for each path, deletions included  |

Checks:

- `bun test sessions.test.ts -t land` passes, and fails before the change.

## Task 2: install dependencies when a session starts

- Status: not started
- Goal: `sessions start` runs the frozen install for each lockfile Git tracks in the new worktree.

Notes:

- `bun.lock` and `bun.lockb` run `bun install --frozen-lockfile`, `package-lock.json` runs `npm ci`, `pnpm-lock.yaml` runs `pnpm install --frozen-lockfile`, and `yarn.lock` runs `yarn install --frozen-lockfile`, each in the lockfile's folder.
- A failed install prints a warning. The session still starts, because the worktree exists.
- `Context` gets `runInstall`, so tests check the commands without installing.

Scope:

| Path                                      | Change                               |
| ----------------------------------------- | ------------------------------------ |
| `.agents/tools/sessions/install.ts`       | lockfile to install command          |
| `.agents/tools/sessions/install.test.ts`  | tests for the mapping                |
| `.agents/tools/sessions/worktree.ts`      | list tracked files                   |
| `.agents/tools/sessions/main.ts`          | real `runInstall`                    |

Seams:

| Interface                          | Behaviour the tests observe                                  |
| ---------------------------------- | ------------------------------------------------------------ |
| `installCommands(paths)`           | one command per lockfile folder, none for other files        |
| `run(["start", ...], ctx)`         | calls `runInstall` per lockfile and warns when one fails     |

Checks:

- `bun test install.test.ts` and `bun test sessions.test.ts -t start` pass, and the new tests fail before the change.

## Task 3: refuse two overlapping builds in one repository

- Status: not started
- Goal: `sessions update <id> --status building` fails while another session in the same repository is `building` with an overlapping scope.

Seams:

| Interface                                         | Behaviour the tests observe                    |
| ------------------------------------------------- | ---------------------------------------------- |
| `run(["update", id, "--status", "building"], ctx)` | fails and names the other session            |

Scope:

| Path                            | Change                  |
| ------------------------------- | ----------------------- |
| `.agents/tools/sessions/cli.ts` | check in `update`       |

Checks:

- `bun test sessions.test.ts -t update` passes, and the new test fails before the change.

## Task 4: name the session in the difit URL

- Status: not started
- Goal: `sessions difit <id>` opens and prints `<url>/?session=<id>`, so each Chrome tab shows its session.

Notes:

- difit 5.0.12 ignores the query string, and its tab title is fixed.

Scope:

| Path                            | Change              |
| ------------------------------- | ------------------- |
| `.agents/tools/sessions/cli.ts` | session in the URL  |

Seams:

| Interface                  | Behaviour the tests observe            |
| -------------------------- | -------------------------------------- |
| `run(["difit", id], ctx)`  | opens and prints the URL with `?session=<id>` |

Checks:

- `bun test sessions.test.ts -t difit` passes, and the changed tests fail before the change.

## Task 5: update the workflow docs

- Status: not started
- Goal: the workflow uses `sessions land`, lets a session start the review subagents, commits the archive, and keeps handoff commits in main.

Scope:

| Path                                                             | Change                                           |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| `.agents/skills/agents-coding-workflow/SKILL.md`                 | Build in main, Review, Start, and Finish lines   |
| `.agents/skills/agents-coding-workflow/references/PLAN-FORMAT.md` | handoff `wip:` commit in main                   |

Checks:

- `grep -n "task branch" .agents/skills/agents-coding-workflow/references/PLAN-FORMAT.md` prints nothing.
- `bun run check` in `.agents/tools/sessions` passes.
