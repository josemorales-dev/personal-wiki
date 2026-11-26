# Sessions scope

## Task 1: Reject a comma-separated scope and clarify the workflow's session commands

- Status: in progress
- Goal: `sessions update` rejects a comma-separated `--scope`, and the workflow skill names the statuses, the difit behaviour, and a route line without dashes.

Notes:

- Retro items 1, 3, 5, and 7 from the `review-standards` session. The scope is checked for commas only, since a session may name a path it has yet to create.
- The check sits in `update`, not in `parseScopePath`, because `sessions land` also parses its paths with `parseScopePath` and must still accept a file name with a comma. Found in review.

Scope:

| Path | Change |
| ---- | ------ |
| `.agents/tools/sessions/cli.ts` | `update` rejects a `--scope` value that contains a comma. |
| `.agents/tools/sessions/sessions.test.ts` | New tests for the comma-separated scope and for landing a file whose name has a comma. |
| `.agents/skills/agents-coding-workflow/SKILL.md` | Route line without an em dash, difit runs in the foreground, Track names every status and when to set it, and says to repeat `--scope`. |

Seams:

| Interface | Behaviour the tests observe |
| --------- | --------------------------- |
| `sessions update <id> --scope <path>` | A path with a comma exits 2 and says to pass `--scope` once per path. |
| `sessions land <id> <path>` | A file whose name has a comma lands. |

Steps:

1. Land the test in main and watch it fail.
2. Land `cli.ts` and watch it pass.
3. Land the skill change.

Checks:

- `bun run check` in `.agents/tools/sessions` shows no type errors and 0 failing tests.
- `grep -c '—' .agents/skills/agents-coding-workflow/SKILL.md` shows 0.
- `npx prettier --check .agents/skills/agents-coding-workflow/SKILL.md` passes.
