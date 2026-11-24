# Unslop artifacts

## Task 1: Run every user-facing artifact through unslop

- Status: not started
- Goal: Every artifact the coding workflow produces for the user follows the `unslop` rules, and the PLAN, scratch, and controls formats comply with them.

Notes:

- `unslop` stays untouched. The workflow skill points at its file, because `disable-model-invocation` stops the agent from loading it as a skill.
- Verbatim content stays exact: proposed code and diffs, command output, and quotes.
- `SCRATCH-FORMAT.md` L51 still says "Use `# Proposed Changes` as the title", a leftover from the last session that contradicts L52. This session deletes it.

Scope:

| Path | Change |
| ---- | ------ |
| `.agents/skills/agents-coding-workflow/SKILL.md` | New `## Writing` section that applies `unslop` to every user-facing artifact. |
| `.agents/skills/agents-coding-workflow/references/PLAN-FORMAT.md` | Plain field labels, tables for Scope and Seams, sentence checks, no dashes, sentence case title. |
| `.agents/skills/agents-coding-workflow/references/SCRATCH-FORMAT.md` | Sentence case headings, line ranges with "to", no dashes or arrows, leftover title rule removed. |
| `.agents/skills/agents-coding-workflow/references/CONTROLS-FORMAT.md` | Field list as sentences, `none` instead of a dash, sentence case title. |

Steps:

1. Apply the changes in `SCRATCH-CODE.md`.
2. Remove this session's row from `.agents/CONTROLS.md` and archive the session.

Checks:

- `grep -nE '—|–|→' references/*.md` run in the workflow skill folder shows no matches.
- `grep -nE '\*\*[A-Za-z]+:\*\*' references/PLAN-FORMAT.md` shows no matches.
- `grep -n 'as the title' references/SCRATCH-FORMAT.md` shows no matches.
- `grep -n '^## Writing' SKILL.md` shows one match.
- `git diff --quiet -- .agents/skills/unslop` exits 0.
