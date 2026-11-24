# Workflows

Jose runs each of these without AI. Your part is to read, gather, and propose, then apply what Jose approves. Each workflow ends on its **done** line.

Rules on where things go and on working with Jose are in the skill's `SKILL.md`. File shapes are in [FORMATS.md](FORMATS.md).

## Capture

Append the item as one line to the bottom of `Inbox.md`. When Jose names the destination ("add to my DSA tasks"), write it there instead.

Done: the line is in the named file or in `Inbox.md`.

## Process the inbox

1. For each line, propose a destination, using the skill's "where things go" rules: a file, a heading, and the exact line, or discard.
2. Show the plan as one list. Apply what Jose approves, and remove those lines from `Inbox.md`.

Done: `Inbox.md` holds only lines Jose chose to keep.

## Prepare a meeting agenda

1. Gather the open items for the meeting:
   - `Next` and `Waiting On` tasks in the section's `Tasks.md`;
   - action items and open proposals from the previous meeting of the same group;
   - `Active` projects due for an update.
2. Propose the agenda bullets, each linking its source, for a note made from `Templates/Meeting.md`.

Done: every open item that concerns this group is on the proposed agenda or was set aside by Jose.

## Summarize a meeting

1. Start from Jose's raw notes, either in the meeting note or pasted. They stay under `## Notes`, unchanged.
2. Fill `Decisions` and `Action Items` (owner, action, deadline if stated) using only what the notes say:
   - a decision is something the notes show was approved;
   - proposals and discussion stay in `Notes`.
3. Reply with three parts:
   - the summary;
   - questions about anything unclear, such as owners, deadlines, or whether something was approved;
   - proposed changes: each of Jose's own action items as a task in the section's `Tasks.md` linking the meeting, and a `Status` line for each project the meeting changed.

Done: every decision and action item in the raw notes is in its section, and each of Jose's items is in `Tasks.md` or declined.

## Run a project

- **Start**: only for a multi-step effort. Propose a note from `Templates/Project.md` with a clear `Goal`, plus its first task in the section's `Tasks.md`.
- **Update**: change `Status` or `Next Steps` when something meaningful changed, linking the meeting or note behind it.
- **Close**: set `Status` to `Done`. List the project's open tasks, for Jose to check off or drop.
- **Stalled**: an `Active` project that no open task links to, or a note unchanged for 30 days (`find "$HOME/Jose's Vault"/*/Projects -name '*.md' -mtime +30`). Report stalled projects, and Jose decides what to do.

Done (close): `Status` reads `Done`, and no open task links the project.

## Find something

Search the section the question is about, in this order, and stop when found:

1. Filenames: `find "$HOME/Jose's Vault/DSA" -iname '*term*'`.
2. Full text: `grep -ril 'term' "$HOME/Jose's Vault/DSA" --include='*.md'`.
3. Backlinks: `grep -rl '\[\[Note name' "$HOME/Jose's Vault/DSA"`.

Answer with `[[links]]` to the notes and the lines that answer. In the app, Jose finds the same through:

- Quick Switcher;
- Backlinks;
- Search, such as `path:"DSA/" onboarding`, or open tasks with `path:"DSA/" task-todo:/./`.

Done: the answer cites its notes, or says nothing matched and offers to capture the question.

## Weekly review (10–15 minutes)

1. Process the inbox.
2. Review the three task lists, and the searches `path:"DSA/" task-todo:/./`, `path:"DSA Tech/" task-todo:/./`, and `path:"Personal/" task-todo:/./`, which catch stray checkboxes:
   - propose removing completed and obsolete tasks, moving any context worth keeping into its meeting or project note first;
   - move items between `Next` and `Later` as Jose decides;
   - list `Waiting On` items whose `since` date is more than two weeks old, to chase or drop.
3. Check that every one of Jose's action items from meetings since the last review is in its section's `Tasks.md`.
4. Review `Active` projects, and list the stalled ones.

Done:

- the inbox has been processed;
- no completed tasks remain;
- every recent action item of Jose's is tracked;
- stalled projects have been reported.

## Audit the vault

Look for friction, and report it as a list of findings, each with a proposed fix and its maintenance cost:

- duplicated information;
- checkboxes outside the three task lists;
- near-duplicate notes;
- notes in the wrong section;
- empty folders outside the structure in `SKILL.md`;
- conventions nobody follows.

Done: every finding cites its notes, and nothing has changed until Jose approves.

## Set up or migrate the vault

1. Inspect the vault: its notes, and the settings in `.obsidian/` (read only).
2. Propose the smallest change, explaining the benefit and maintenance cost of anything that departs from the skill's structure:
   - a dated backup copy of the vault first;
   - create `Inbox.md`, the three `Tasks.md` files (with `## Next`, `## Waiting On`, and `## Later`), and both `Knowledge Base.md` files if missing;
   - copy this skill's `assets/Templates/` into the vault if missing;
   - create every other folder in the structure, even before its first note;
   - give every existing note a proposed destination.
3. Apply only what Jose approves. Existing content moves as is, and links are updated by the rename rule.
4. Give Jose these settings to set; the agent leaves `.obsidian/` alone:
   - Core plugins → Templates on, with Template folder location `Templates`, and a hotkey for "Templates: Insert template" (check the one chosen is free).
   - Files and links → Automatically update internal links: on.
   - Core plugins → File recovery: on.
   - Bookmarks: `Inbox.md`, the three `Tasks.md` files, and the `DSA/Meetings/` folder. Bookmark a search only once Jose runs it often.
   - Backups: File Recovery covers recent local edits only. Obsidian Sync version history plus Time Machine, or another off-machine copy, is the real backup.
   - Privacy: folders and AI instructions are not security boundaries. Anything that must never reach an AI assistant belongs outside this vault.
   - The Daily notes core plugin can be turned off, since the system doesn't use it.

Done: every existing note is in an approved home, the full structure in `SKILL.md` exists, and every note still reads as ordinary Markdown.
