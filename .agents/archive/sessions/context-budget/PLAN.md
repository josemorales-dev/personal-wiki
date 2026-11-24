# Cut context use in the coding workflow

## Task 1: Trim what a coding session loads and repeats

- Status: not started
- Goal: Sessions read less, quote less, and state each planning rule once, with the approval gate unchanged.

Notes:

- The edits are in `AGENTS.md` and the hub's own skills only. Vendored skills stay untouched.
- `AGENTS.md` keeps the **Planning** rule, because it is always loaded. The workflow skill points at it.
- `PATHS.md` stays reachable from `AGENTS.md` and the workflow skill. The two standards skills drop their own pointer to it.

Scope:

| Path | Change |
| --- | --- |
| `.agents/skills/agents-coding-workflow/references/SCRATCH-FORMAT.md` | Hunks are located by context lines, not line numbers. |
| `.agents/skills/agents-coding-workflow/SKILL.md` | Research runs in an `Explore` subagent. Check output is quoted as summary plus failures. Repeats of the Planning rule are removed. |
| `.agents/skills/agents-code-standards/SKILL.md`, `.agents/skills/agents-language-standards/SKILL.md` | Remove the `PATHS.md` prerequisite. |
| `.agents/skills/agents-language-standards/SKILL.md` | The TypeScript reference is read before writing or reviewing, not before reading code. |

Steps:

1. Apply `SCRATCH-CODE.md` in the worktree.
2. Check each edited file against unslop and `writing-for-agents`.

Checks:

- `grep -n 'L<n>\|L[0-9]' .agents/skills/agents-coding-workflow/references/SCRATCH-FORMAT.md` prints nothing.
- `grep -c 'PATHS.md' .agents/skills/agents-code-standards/SKILL.md .agents/skills/agents-language-standards/SKILL.md` prints 0 for both.
- `grep -n 'small, clear\|small, unambiguous' .agents/skills/agents-coding-workflow/SKILL.md` prints nothing.
- `grep -n 'Explore' .agents/skills/agents-coding-workflow/SKILL.md` prints the Research step.
- `git diff --stat` lists only the four `Scope` paths.

## Task 2: Limit code-review to code and make approval unambiguous

- Status: not started
- Goal: `code-review` runs only on code changes, and approval is a separate yes-or-no question that names what it covers.

Scope:

| Path | Change |
| --- | --- |
| `.agents/skills/agents-coding-workflow/SKILL.md` | Step 7 reviews instruction and doc changes against `writing-for-agents` and unslop. Step 3 asks for approval as its own question. |

Steps:

1. Apply the Task 2 hunks in `SCRATCH-CODE.md` in the worktree.

Checks:

- `grep -n 'For a code change, run .code-review.' .agents/skills/agents-coding-workflow/SKILL.md` prints step 7.
- `grep -n 'yes-or-no question' .agents/skills/agents-coding-workflow/SKILL.md` prints step 3.
