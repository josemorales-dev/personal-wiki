# Formats

The formats use plain Markdown: headings, lists, checkboxes, and `[[wikilinks]]`. Dates are `YYYY-MM-DD`, written in the text.

Obsidian shows the filename as the note's title, so notes start without an `#` heading: the filename carries the title, and a meeting's date.

Templates exist only for meetings and projects. Their sources are in this skill's `assets/Templates/`. A template is a starting point: drop the sections a note doesn't need.

## Properties

Notes carry these four properties and no others, and no tags:

| Property      | On                   | Value                                                  |
| ------------- | -------------------- | ------------------------------------------------------ |
| `status`      | projects             | `active` or `done`                                     |
| `date`        | meetings             | the meeting's date                                     |
| `aliases`     | any note             | other names Jose searches for, such as `OC`            |
| `description` | knowledge base pages | one line on what the page covers, shown by the hub     |

The templates set `status` and `date`. Obsidian fills `{{date}}` with the day the note is made, so a meeting note made ahead of time gets its `date` corrected to the meeting's day. Add `aliases` when Jose searches for a note under a name its filename lacks.

Bases read these properties: `Review.base` and the embedded base in each knowledge base hub. Each note's text still reads in full without them.

## Citations

The rule is **Cite every claim** in `SKILL.md`; these are its shapes, in every note.

A fact from another note links it inline: `Approved: teach-in moves to 2026-12-06 — [[2026-11-18 OC General Meeting]]`.

A fact from outside the vault carries a footnote. Its definition names the author, title, and date, says how far to trust the source (official, press, or written by a caucus), and ends in the URL. Footnotes resolve only within their own note, so each note carries the definitions it cites, copied word for word.

```md
- The CLC has 108 seats from 2026.[^announce]

[^announce]: NYC-DSA, "2026 NYC-DSA Chapter Elections," 2026-11-23. Official. https://socialists.nyc/...
[^obe]: Pedro LR (NBK), "One Big Election" resolution, 2026. Text pasted by Jose on 2026-11-23. Official proposal text. URL needed.
```

A note drawn from one source, such as a reading note, names it once in an opening `Source:` line.

What no source confirms sits in a callout, apart from the cited facts: `[!question]` for an open or unpublished point, `[!note]` for an inference.

```md
> [!question] Not published, as of 2026-11-23
> - the quota and voting software

> [!note] My own inference, not taken from any source
> - An independent has no organized base of first-choice votes.
```

## `Inbox.md`

One line per capture, newest at the bottom. No categorizing, tagging, or formatting is required.

```md
- Ask Maria about the spring canvass training
- Book idea: The Power Broker
```

## `Tasks.md`, one per section

```md
## Next

- [ ] Send the turnout script — due 2026-11-25 — [[2026-11-18 OC General Meeting]]
- [ ] Review onboarding proposal — [[Member Onboarding]]

## Waiting On

- [ ] Maria: meeting space confirmation — since 2026-11-18 — [[2026-11-18 OC General Meeting]]

## Later

- [ ] Draft the spring canvass plan
```

- **Next**: Jose's own actions, doable now. Line order is priority, most important first.
- **Waiting On**: delegated work, an outstanding response, or an external dependency. The line starts with `Person:` and carries `— since YYYY-MM-DD`, the day the wait began.
- **Later**: not actionable yet, or not a priority.
- Every line has one shape: `- [ ] Verb and thing`, then `— due YYYY-MM-DD` only for a real deadline, then `— [[source]]` when it came from a meeting or project.
- Completed and obsolete tasks are removed in the weekly review. Context worth keeping goes into the meeting or project note first.

## Meeting note: `DSA/Meetings/2026-11-18 OC General Meeting.md`

Start it from `Templates/Meeting.md`. Prepare the agenda before the meeting, take notes during it, and record the outcomes after.

```md
---
date: 2026-11-18
---

## Agenda

- November action debrief
- Teach-in date — [[Rent Strike Teach-in]]

## Notes

- Turnout for the November action was lower than planned.
- Proposal (Maria): move the teach-in to December.

## Decisions

- Approved: teach-in moves to 2026-12-06.

## Action Items

- Jose: send the turnout script — due 2026-11-25
- Maria: confirm the meeting space
```

- In `Notes`, mark proposals as proposals. `Decisions` holds only what was approved.
- Action items name an owner and a deadline when known. They are the historical record; Jose's items also go to the section's `Tasks.md`.
- Link the projects and knowledge base pages or headings the meeting touched.

## Project note: `DSA/Projects/Rent Strike Teach-in.md`

Start it from `Templates/Project.md`, in every section.

```md
---
status: active
---

## Goal

A teach-in on tenant organizing with 40+ attendees, on 2026-12-06.

## Status

Venue confirmed, outreach under way.

## Notes

- Date moved at [[2026-11-18 OC General Meeting]].

## Next Steps

- Phone bank outreach, then the speaker lineup.

## Related

- [[Member Onboarding]]
```

- The `status` property holds the state; `## Status` is one short line on where the project stands.
- `Next Steps` names the next meaningful step; its checkboxes live in `Tasks.md`.
- Update the note only when something meaningful changed.
- A finished project keeps its note, with `status: done`, which moves it out of `Review.base`'s active views.

## `Knowledge Base.md`, in `DSA/` and `DSA Tech/`

One `##` heading per topic (`Roles`, `Procedures`, `Links`; for DSA Tech, `Repositories`, `Access`, `Hosting`), added as the need appears.

A topic that outgrows its heading becomes a page in the section's `Knowledge Base/` folder, named so it stands apart in Quick Switcher (`Election Rules`, beside the `Chapter Elections 2026-27` project). `Knowledge Base.md` stays as the hub: an embedded base that lists the pages, then the topics still short enough to be headings. Each page carries a `description` property, which the base shows beside its name, so a new page appears in the hub without editing it.

````md
```base
filters:
  and:
    - file.inFolder(this.file.folder + "/Knowledge Base")
views:
  - type: table
    name: Pages
    order:
      - file.name
      - description
```

## Links
````

A page opens with its `description`:

```md
---
description: Who votes and runs, ballots, timing, and what is unpublished.
---
```

## `Review.base`

The weekly review's view of the vault, at the vault root. Its source is this skill's `assets/Review.base`. It skips `Templates/` and has these views:

- **Stalled projects**: `active` and unchanged for 30 days.
- **Active projects**: oldest change first, with the days since.
- **Done projects**: what the review clears from the active list, for Jose to keep or delete.
- **Recent meetings**: the last 30 days, newest first.

Read a view from the terminal with `obsidian base:query path=Review.base view="Stalled projects" format=md`.

## Personal note: `Personal/Notes/The Power Broker.md`

No template and no fixed sections: a descriptive filename and ordinary Markdown. A reading note opens with its source and keeps quotes apart from Jose's own thoughts:

```md
Source: Robert Caro, 1974

> Quote worth keeping. (p. 123)

- Jose's own takeaway, linked to [[Related note]].
```
