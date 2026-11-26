# Drop paused projects

## Task 1: remove the paused status and name the meetings bookmark

- Status: in progress
- Goal: projects are only `active` or `done`, and the setup names the `DSA/Meetings/` bookmark "DSA meetings".

Notes:

- No note in the vault has `status: paused`, so no project needs migrating.
- The vault's own `Review.base` and bookmarks are outside this repository. Jose changes them after approval; see the reply.

Scope:

| Path | Change |
| --- | --- |
| `.agents/skills/agents-obsidian-workflow/assets/Review.base` | Remove the Paused projects view. |
| `.agents/skills/agents-obsidian-workflow/references/FORMATS.md` | `status` is `active` or `done`; drop Paused projects from the view list. |
| `.agents/skills/agents-obsidian-workflow/references/WORKFLOWS.md` | Stalled projects are continued or closed; the meetings bookmark is named "DSA meetings". |

Steps:

1. Apply the three edits.

Checks:

- `grep -rni paus .agents/skills/agents-obsidian-workflow` finds nothing.
- `grep -n 'DSA meetings' .agents/skills/agents-obsidian-workflow/references/WORKFLOWS.md` finds the bookmarks line.
