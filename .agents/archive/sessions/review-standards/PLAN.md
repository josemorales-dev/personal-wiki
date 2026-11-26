# Review standards

## Task 1: Make the standards explicit at write and review time

- Status: in progress
- Goal: Every coding route applies the standards, `no-comments`, and unslop at fixed steps, and every approval is one yes-or-no question.

Notes:

- The Standards section says when each rule applies, so it covers a small change, which skips Draft.
- The Prettier warning on `code-review/SKILL.md` exists on main already and is out of scope.

Scope:

| Path | Change |
| ---- | ------ |
| `.agents/skills/agents-coding-workflow/SKILL.md` | A new Standards section lists the code standards, `no-comments`, and unslop, and says when each applies. A new Approval section fixes the approval question as `Approve <what>? (yes/no)`, used by Size and Approve. Draft checks the draft against the standards. Review names both standards skills and the fixed point. |
| `.agents/skills/code-review/SKILL.md` | Uncommitted changes are diffed against the working tree. The Standards sub-agent gets the reference paths. |
| `.agents/skills/implement/SKILL.md`, `.agents/skills/implement-spec/SKILL.md` | The implementer loads both standards skills before writing code. |

Steps:

1. Land the draft in main.
2. Archive the session.

Checks:

- `grep -c 'agents-code-standards' .agents/skills/implement/SKILL.md .agents/skills/implement-spec/SKILL.md` shows 1 for each file.
- `grep -n 'ENGINEERING_STANDARDS.md' .agents/skills/code-review/SKILL.md` shows one match.
- `grep -n 'the draft follows the standards' .agents/skills/agents-coding-workflow/SKILL.md` shows one match.
- `grep -c '^## Standards$\|^## Approval$' .agents/skills/agents-coding-workflow/SKILL.md` shows 2.
- `grep -c 'yes-or-no' .agents/skills/agents-coding-workflow/SKILL.md` shows 0.
- `npx prettier --check` on the workflow, implement, and implement-spec skills passes.
