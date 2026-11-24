# Sessions tool: carry uncommitted work, a bare command, and a format check

## Task 1: Carry uncommitted changes into a new worktree

- Status: done
- Goal: `sessions start` from the current branch copies the repository's uncommitted changes and untracked files into the new worktree, uncommitted, and lists them.

Notes:

- Carrying happens only when the session starts from the current branch, because the uncommitted changes belong to it. With `--base` naming another ref, nothing is carried.
- Ignored files are not carried. `git ls-files --others --exclude-standard` lists the untracked ones.
- The main checkout keeps its copy. Before merging, the user commits or stashes it for any file the session also changed. The `start` output and the workflow skill both say so.

Scope:

| Path | Change |
| --- | --- |
| `.agents/tools/sessions/worktree.ts` | New `carryUncommitted(repo, worktree)`. |
| `.agents/tools/sessions/cli.ts` | `start` carries, reports `carried` in JSON and text, and documents it in its help. |
| `.agents/tools/sessions/sessions.test.ts` | Tests for carrying. |

Seams:

| Interface | Behaviour the tests observe |
| --- | --- |
| `sessions start` | Uncommitted, staged, and untracked files appear in the worktree with no new commit; `--json` lists them as `carried`; `--base` on another branch carries nothing. |

Steps:

1. Write the carrying tests and see them fail.
2. Add `carryUncommitted` and call it from `start`.

Checks:

- `bun test sessions.test.ts` passes, including the four new `start` tests.

## Task 2: Check a session's files against the formats

- Status: done
- Goal: `sessions check-format <id>` reports every mechanical break of `PLAN-FORMAT.md` and `SCRATCH-FORMAT.md` as `file:line: message`, and exits 1 when it finds one.

Notes:

- It checks only rules a script can decide: titles, heading shapes, operation names, task fields, the `Files to delete` list, and that `Scope` paths and scratch sections match. Wording rules stay with the reviewer.
- Headings inside fenced code blocks are content, not structure. The check tracks fences by length, so a four-backtick fence can hold a three-backtick one.
- `SCRATCH-TESTS.md` is optional. `PLAN.md` and `SCRATCH-CODE.md` are required.

Scope:

| Path | Change |
| --- | --- |
| `.agents/tools/sessions/format-check.ts` | New module: `checkSessionFormat(read)`. |
| `.agents/tools/sessions/format-check.test.ts` | Tests for each rule. |
| `.agents/tools/sessions/cli.ts` | New `check-format` command. |
| `.agents/tools/sessions/sessions.test.ts` | Tests for the command, and `check-format` in the help test. |

Seams:

| Interface | Behaviour the tests observe |
| --- | --- |
| `checkSessionFormat(read)` | Returns no problems for files that follow the formats, and one problem per broken rule otherwise. |
| `sessions check-format <id>` | Exit 0 and a confirmation, or exit 1 with each problem as `file:line: message`. |

Steps:

1. Write the `format-check.test.ts` tests one rule at a time, each red then green.
2. Add the CLI command and its tests.

Checks:

- `bun test format-check.test.ts` passes.
- `bun .agents/tools/sessions/main.ts check-format sessions-tooling` exits 0 on this session's own files.

## Task 3: Put `sessions` on PATH and update the workflow skill

- Status: done
- Goal: Agents run `sessions` as a bare command, and the workflow skill names it, the carrying rule, and `check-format`.

Scope:

| Path | Change |
| --- | --- |
| `.agents/tools/sessions/package.json` | New `link` script that symlinks `main.ts` to `~/.local/bin/sessions`. |
| `.agents/skills/agents-coding-workflow/SKILL.md` | Name the bare command and how to install it, the carrying rule in Start, and `check-format` in Approve. |

Steps:

1. Run `bun run link` in `.agents/tools/sessions/`.

Checks:

- `sessions list` runs from `/tmp` and prints the active sessions.
- `bun run check` in `.agents/tools/sessions/` shows 0 fail and a clean `tsc`.

## Task 4: Fix the review findings

- Status: done
- Goal: Carrying and `check-format` handle the edge cases the review found, and the standards cleanups are applied.

Notes:

- The findings come from the two-axis review of the first three tasks. The `link` script stays because the user asked for it. The direct `Bun.spawnSync` calls in `carryUncommitted` stay because `git()` trims output and takes no stdin.

Scope:

| Path | Change |
| --- | --- |
| `.agents/tools/sessions/worktree.ts` | Pin the diff format, list both rename paths, skip untracked directories, report copy failures, and compare bases by commit. |
| `.agents/tools/sessions/cli.ts` | Carry when the base resolves to the current commit; build the carried rows and note in one branch. |
| `.agents/tools/sessions/format-check.ts` | Accept CRLF and `Rename from` paths with spaces; require a task; report duplicate sections; build messages from the lists. |
| `.agents/tools/sessions/format-check.test.ts`, `.agents/tools/sessions/sessions.test.ts` | One failing test per bug; rename fixtures; assert the missing-session message. |

Steps:

1. Write one test per bug and see each fail.
2. Fix each bug, then apply the cleanups with the suite green.

Checks:

- `bun run check` in `.agents/tools/sessions/` shows 0 fail and a clean `tsc`.
