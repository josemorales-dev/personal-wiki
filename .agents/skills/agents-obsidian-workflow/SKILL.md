---
name: agents-obsidian-workflow
description: Obsidian vault workflow for Jose's personal, NYC DSA, and DSA tech notes: where things go, note formats, and the weekly review. Use when capturing to the inbox, updating a task list, preparing or summarizing a meeting, tracking a project, finding something in the vault, or running the weekly review.
---

# Obsidian workflow

Vault: `~/Jose's Vault`. Quote the path; it contains a space and an apostrophe.

Jose runs this vault daily in plain Obsidian; you are an occasional helper. Every change leaves it working without you: plain Markdown, built-in features, nothing extra to maintain.

## Structure

```text
Inbox.md
DSA/
  Tasks.md
  Knowledge Base.md
  Meetings/
  Projects/
DSA Tech/
  Tasks.md
  Knowledge Base.md
  Meetings/
  Projects/
Personal/
  Tasks.md
  Projects/
  Notes/
Templates/
  Meeting.md
  Project.md
```

`DSA/` holds NYC DSA organizing, including the Lower Manhattan Organizing Committee (OC). `DSA Tech/` holds the software Jose builds or maintains for DSA, and shares `DSA/`'s shape. `Personal/` holds everything else. Every folder exists from setup, even while empty.

This is the starting structure, and it grows only by **progressive organization**: structure is added once the notes already there need it. Anything beyond it, such as a folder, a template, a plugin, properties, or Bases, starts as a proposal to Jose that answers five questions:

- Does it solve a real problem?
- Does it save more work than it costs?
- Could an existing feature do it?
- Does the vault still work without AI?
- Will Jose keep it up?

The first such step, once projects grow hard to track, is a single `status` property (`active`, `paused`, `done`) with one filtered Bases view.

## Where things go

First match wins:

1. Unsure, or capturing fast → a line in `Inbox.md`.
2. Something to do → the section's `Tasks.md`. Appointments and events go in Jose's calendar.
3. A DSA or DSA Tech meeting's agenda, discussion, and outcomes → a note in the section's `Meetings/`.
4. A multi-step effort toward a goal → a note in the section's `Projects/`. A standalone task stays a task.
5. A fact, procedure, responsibility, or link looked up repeatedly → a heading in the section's `Knowledge Base.md`. For DSA Tech that means what no repository records: who maintains what, access, hosting, and links to the repositories. How the code works stays in its repository.
6. Personal knowledge, reading notes, interests, reflections, ideas → a note in `Personal/Notes/`.
7. Temporary information with no remaining value → proposed to Jose for discarding.

Search for an existing note first; extending one beats creating another.

Filenames are what Jose would search for, since Quick Switcher is the main way around the vault. Meetings take the form `YYYY-MM-DD Meeting name`, so they sort by date. Projects and notes take a plain descriptive name, such as `Member Onboarding`. Avoid `[ ] # ^ | \ / : * " < > ?` in filenames.

## One task list per section

- The three `Tasks.md` files are the only live task lists, so "what do I need to do?" and "what am I waiting on?" each have one answer per section.
- A meeting's `Action Items` are its historical record, and a project's `Next Steps` names its next meaningful step. Jose's own actions from either become tasks, linking back to their source.
- Every link earns its place by leading somewhere Jose will want to go. Backlinks, Quick Switcher, Search, and Bookmarks replace hand-kept indexes and dashboards.

Formats, templates, and examples: [references/FORMATS.md](references/FORMATS.md). Read it before creating or restructuring a file.

## Working with Jose

- **Read-only by default.** Inspect the relevant files, then answer or propose. Edit only after Jose approves a concise change list giving the exact lines per file. An explicit instruction that names the change ("add X to my DSA tasks") is that approval. Everything you infer is a proposal first.
- **Source only.** Decisions, commitments, owners, and deadlines come from the notes or from Jose, cited by `[[link]]`. Outside facts cite a URL Jose can follow. A source without a URL (a paste, a conversation) gets its URL from Jose before it is cited. Keep three things visibly apart: what the notes confirm, what you assume, and what you propose. Anything unclear is a question for Jose.
- **History stays.** Original wording, past decisions, dates, and links remain. Superseded text gets a dated line pointing at what replaced it.
- **Backup first.** Before a migration or a change touching more than three notes, propose a dated copy of the vault (`~/Jose's Vault backups/YYYY-MM-DD/`), and make it once Jose agrees.
- **Approval by name.** Delete, move, rename, or substantially rewrite a note only after Jose approves that change. A rename also rewrites every `[[Old name` link (covering `|`, `#`, and `![[` forms), since renaming on disk leaves links broken. Afterwards, a search for `[[Old name` must find nothing.
- **Sections stay apart.** A request about one section reads and edits only that section, unless Jose names more. In Obsidian search, `path:DSA` also matches `DSA Tech`; scope to DSA alone with `path:"DSA/"`.
- **Privacy.** Confidential membership information (who is a member, contact details, attendance, internal disputes), private conversations, and Jose's sensitive personal matters (health, money, family) need Jose's explicit go-ahead for that note.
  - When a broader search turns them up, name the note and leave the details out.
  - Keep them out of summaries, other notes, and anything that leaves this computer.
  - When capturing, record only the sensitive detail the note actually needs. Official DSA records belong in DSA's own systems.
- Edit notes in place. `.obsidian/` belongs to the app; settings are steps for Jose.

## Workflows

[references/WORKFLOWS.md](references/WORKFLOWS.md) holds the workflows:

- capture
- process the inbox
- prepare a meeting agenda
- summarize a meeting
- run a project
- find something
- the weekly review
- audit the vault
- set up or migrate the vault

For syntax, use `obsidian-markdown`. Use `obsidian-cli` when `obsidian` is on `PATH`, and `obsidian-bases` only once Jose approves a Bases view. For current Obsidian behaviour, check the official docs at obsidian.md/help.
