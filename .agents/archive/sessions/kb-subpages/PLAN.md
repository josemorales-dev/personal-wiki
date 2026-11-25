# Knowledge base subpages and callouts

## Task 1: Teach the Obsidian skill the hub-and-pages knowledge base

- Status: done
- Goal: The skill describes a knowledge base that grows from headings into `Knowledge Base/` pages behind a hub, with per-page footnotes and callouts for unconfirmed points.

Notes:

- The setup tree in `SKILL.md` stays unchanged: `Knowledge Base/` appears only once a topic needs it (progressive organization).
- Jose chose callouts only; no `aliases` property and no rename of the hub.

Scope:

| Path | Change |
| --- | --- |
| `.agents/skills/agents-obsidian-workflow/SKILL.md` | "Where things go" #5 names the `Knowledge Base/` pages |
| `.agents/skills/agents-obsidian-workflow/references/FORMATS.md` | Knowledge base section: hub and pages, per-page footnotes, callouts; meeting-note link line covers pages |

Steps:

1. Edit both files as scoped.

Checks:

- `grep -n "Knowledge Base/" .agents/skills/agents-obsidian-workflow/SKILL.md .agents/skills/agents-obsidian-workflow/references/FORMATS.md` shows rule #5 and the FORMATS section.
- `grep -n "headings the meeting" .agents/skills/agents-obsidian-workflow/references/FORMATS.md` shows "pages or headings".

## Task 2: Apply callouts in the DSA knowledge base

- Status: done
- Goal: The two standalone unsourced passages in `~/Jose's Vault/DSA/Knowledge Base/` render as callouts, with their wording unchanged.

Notes:

- Vault files are outside Git; the 2026-11-25 vault backup covers them.
- Nested "Unconfirmed:" and "No source confirms" sub-bullets stay as text; callouts inside list items render unreliably in Live Preview.

Scope:

| Path | Change |
| --- | --- |
| `DSA/Knowledge Base/Election Rules.md` | Lines 29–35, the "Not published, as of 2026-11-23" bullet and its sub-list → `> [!question] Not published, as of 2026-11-23` with the same items |
| `DSA/Knowledge Base/Internal Politics.md` | Lines 113–116, "My own inference, not taken from any source:" and its two bullets → `> [!note] My own inference, not taken from any source` with the same bullets |

Steps:

1. Rewrite each passage as a callout.

Checks:

- `grep -n "^> \[!" "$HOME/Jose's Vault/DSA/Knowledge Base/"*.md` shows exactly the two callouts.
- Every original line of both passages, minus its list or heading prefix, appears inside a callout.

## Task 3: Make citations a hard requirement across the vault

- Status: done
- Goal: The Obsidian skill requires a citation, or a callout when no source exists, for every fact an agent writes into any note.

Notes:

- Replaces the **Source only** rule. A paste without a URL is now cited with `URL needed` and Jose is asked for it, matching the existing knowledge base, instead of waiting for the URL before citing.
- Jose's own words (captures, tasks, reflections, meeting records) need no citation.

Scope:

| Path | Change |
| --- | --- |
| `.agents/skills/agents-obsidian-workflow/SKILL.md` | **Source only** → **Cite every claim**, a hard requirement with vault, outside, unsourced, and exempt cases |
| `.agents/skills/agents-obsidian-workflow/references/FORMATS.md` | New `## Citations` section holding the footnote and callout shapes, moved out of the knowledge base section |
| `.agents/skills/agents-obsidian-workflow/references/WORKFLOWS.md` | Audit lists facts with neither a citation nor a callout |

Steps:

1. Edit the three files as scoped.

Checks:

- `grep -n "Cite every claim" .agents/skills/agents-obsidian-workflow/SKILL.md .agents/skills/agents-obsidian-workflow/references/FORMATS.md` shows the rule and its back-reference.
- `grep -c "Source only" .agents/skills/agents-obsidian-workflow/SKILL.md` prints 0.
- `grep -n "neither a citation" .agents/skills/agents-obsidian-workflow/references/WORKFLOWS.md` shows the audit line.
