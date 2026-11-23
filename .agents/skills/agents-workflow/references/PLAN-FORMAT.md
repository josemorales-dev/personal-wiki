# PLAN.md Format

Write plans in terse, clear language. Include only information needed to execute, validate, or resume the work.

## Structure

```md
# <Title>

## Task N: <verb phrase>

**Status:** not started | in progress | done | blocked
**Goal:** <one sentence describing the required result>
**Notes:**

- <non-obvious constraint, decision, or dependency>

**Scope:**

- `<path>` — <intended change>

**Steps:**

1. <imperative action>

**Checks:**

- `<command>` — <expected result>

## Handoff

- **Done:** <completed work>
- **Next:** <next action>
- **Blocker:** <reason work cannot continue>
```

## Rules

- State each fact once. Do not repeat the goal in notes, scope, steps, or handoff.
- Use short, direct sentences and imperative steps.
- Keep `Goal` to one sentence.
- Omit `Notes` unless the task has non-obvious constraints, decisions, or dependencies. Reference authoritative project documents instead of summarizing them.
- List each changed path once in `Scope`; group paths that receive the same change.
- Keep steps independently actionable. Put verification only in `Checks`.
- Use exact commands, behaviors, or assertions in `Checks`.
- Omit `Handoff` unless work stops unfinished. Include only the applicable handoff fields.
- Make each task independently resumable from its goal, notes, scope, steps, and checks.
