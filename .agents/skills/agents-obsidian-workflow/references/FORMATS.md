# Formats

The formats use plain Markdown: headings, lists, checkboxes, and `[[wikilinks]]`. Dates are `YYYY-MM-DD`, written in the text.

Obsidian shows the filename as the note's title, so notes start without an `#` heading: the filename carries the title, and a meeting's date.

There are no properties, tags, priority codes, or status systems beyond what this file shows.

Templates exist only for meetings and projects. Their sources are in this skill's `assets/Templates/`. A template is a starting point: drop the sections a note doesn't need.

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
- Action items name an owner and a deadline when known. They are the historical record; Jose's items also go to `DSA/Tasks.md`.
- Link the projects and `Knowledge Base` headings the meeting touched.

## Project note: `DSA/Projects/Rent Strike Teach-in.md`

Start it from `Templates/Project.md`, for DSA and Personal projects alike.

```md
## Goal

A teach-in on tenant organizing with 40+ attendees, on 2026-12-06.

## Status

Active — venue confirmed, outreach under way.

## Notes

- Date moved at [[2026-11-18 OC General Meeting]].

## Next Steps

- Phone bank outreach, then the speaker lineup.

## Related

- [[Member Onboarding]]
```

- `Status` is one short line starting with `Active`, `Paused`, or `Done`.
- `Next Steps` names the next meaningful step; its checkboxes live in `Tasks.md`.
- Update the note only when something meaningful changed.
- A finished project keeps its note, with `Done`.

## `DSA/Knowledge Base.md`

One `##` heading per topic (`Roles`, `Procedures`, `Links`), added as the need appears.

## Personal note: `Personal/Notes/The Power Broker.md`

No template and no fixed sections: a descriptive filename and ordinary Markdown. A reading note opens with its source and keeps quotes apart from Jose's own thoughts:

```md
Source: Robert Caro, 1974

> Quote worth keeping. (p. 123)

- Jose's own takeaway, linked to [[Related note]].
```
