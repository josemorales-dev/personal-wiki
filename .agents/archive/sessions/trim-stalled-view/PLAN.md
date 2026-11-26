# Trim the stalled projects view

## Task 1: fold Stalled projects into Active projects

- Status: in progress
- Goal: `Review.base` drops its Stalled projects view, and the review finds stalled projects at the top of Active projects.

Notes:

- With `paused` gone, Stalled projects only repeats the top of Active projects, which already sorts oldest change first and shows the days since.
- "Stalled" stays as a word: an `active` project unchanged for 30 days or more, or one no open task links to.
- The vault's own `Review.base` gets the same deletion after approval.

Scope:

| Path | Change |
| --- | --- |
| `.agents/skills/agents-obsidian-workflow/assets/Review.base` | Remove the Stalled projects view. |
| `.agents/skills/agents-obsidian-workflow/references/FORMATS.md` | Define stalled under Active projects; the terminal example queries Active projects. |
| `.agents/skills/agents-obsidian-workflow/references/WORKFLOWS.md` | Run a project and the weekly review find stalled projects in Active projects. |

Steps:

1. Apply the three edits.

Checks:

- `grep -rn "Stalled projects" .agents/skills/agents-obsidian-workflow` finds nothing.
