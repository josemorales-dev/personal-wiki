# Obsidian features in the vault workflow

## Task 1: Teach the Obsidian skill properties, Bases, and the CLI

- Status: in progress
- Goal: The skill uses four properties, a review base, a self-listing knowledge base hub, and CLI renames, and lists the app settings Jose turns on.

Notes:

- Jose approved all six items of the 2026-11-25 research reply, including `aliases`, which the kb-subpages session had left out.
- Bases list notes, not checkboxes, so `Tasks.md` stays the task list. Cleanup of completed and obsolete tasks uses a bookmarked search for checked boxes.
- Projects keep their notes when done. The review base shows the `done` ones so Jose can decide whether to delete them, and keeps them out of the active views.

Scope:

| Path | Change |
| --- | --- |
| `.agents/skills/agents-obsidian-workflow/SKILL.md` | Structure adds `Review.base`; progressive organization names what is now adopted; rename rule uses `obsidian move`; Full Calendar named; `obsidian-bases` pointer updated |
| `.agents/skills/agents-obsidian-workflow/references/FORMATS.md` | A Properties section (`status`, `date`, `aliases`, `description`); project and meeting examples carry them; knowledge base hub embeds a base; the review base |
| `.agents/skills/agents-obsidian-workflow/references/WORKFLOWS.md` | Run a project and the weekly review use the review base and the completed-tasks search; setup adds the settings and bookmarks |
| `.agents/skills/agents-obsidian-workflow/assets/Templates/Meeting.md`, `assets/Templates/Project.md` | Frontmatter with `date` and `status` |
| `.agents/skills/agents-obsidian-workflow/assets/Review.base` | New: the review base |
| `.gitignore` | Un-ignore `assets/Templates/Project.md`: the global `PROJECT.md` rule matched it on the case-insensitive disk, so it was never tracked |

Steps:

1. Edit the skill files as scoped.

Checks:

- `grep -rn "There are no properties" .agents/skills/agents-obsidian-workflow` finds nothing.
- `ruby -ryaml -e 'YAML.safe_load(File.read(ARGV[0]))' .agents/skills/agents-obsidian-workflow/assets/Review.base` exits 0.
- `grep -n "obsidian move" .agents/skills/agents-obsidian-workflow/SKILL.md` shows the rename rule.

## Task 2: Apply the changes in the vault

- Status: not started
- Goal: The vault's templates, project, knowledge base hub and pages, and `Review.base` match the updated skill.

Notes:

- The vault is outside Git. Make a fresh dated backup first; this touches more than three notes.

Scope:

| Path | Change |
| --- | --- |
| `Templates/Meeting.md`, `Templates/Project.md` | Copied from the skill's assets |
| `Review.base` | Copied from the skill's assets |
| `DSA/Projects/Chapter Elections 2026-27.md` | `status: active` property; `## Status` line drops its leading `Active —` |
| `DSA/Knowledge Base.md` | The hand-kept page list becomes an embedded base |
| `DSA/Knowledge Base/*.md` | `description` property carrying the hub's old one-line text, word for word |
| `DSA/Projects/Chapter Elections 2026-27.md` | `aliases` only if Jose names one |

Steps:

1. Back up the vault to `~/Jose's Vault backups/2026-11-25-2/`.
2. Make the scoped edits.

Checks:

- `obsidian property:read name=status path="DSA/Projects/Chapter Elections 2026-27.md"` prints `active`.
- `obsidian property:read name=description path="DSA/Knowledge Base/Election Rules.md"` prints the old hub text.
- Opening `Review.base` and `DSA/Knowledge Base.md` in Obsidian shows the views with no YAML error (Jose confirms).
