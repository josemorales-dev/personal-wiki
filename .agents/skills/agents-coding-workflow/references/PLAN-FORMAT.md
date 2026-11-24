# PLAN.md format

Write plans in terse, clear language. Include only information needed to execute, validate, or resume the work.

## Structure

```md
# <Title>

## Task N: <verb phrase>

- Status: not started | in progress | done | blocked
- Goal: <one sentence describing the required result>

Notes:

- <non-obvious constraint, decision, or dependency>

Scope:

| Path     | Change            |
| -------- | ----------------- |
| `<path>` | <intended change> |

Seams:

| Interface            | Behaviour the tests observe |
| -------------------- | --------------------------- |
| `<public interface>` | <behaviour>                 |

Steps:

1. <imperative action>

Checks:

- `<command>` shows <expected result>.

## Handoff

- Done: <completed work, with the checks that proved it>
- State: <branch, last commit, whether the tree is clean or broken>
- Next: <first action on resume>
- Blocker: <reason work cannot continue>
```

## Rules

- State each fact once. Do not repeat the goal in notes, scope, steps, or handoff.
- Use short, direct sentences and imperative steps.
- Keep `Goal` to one sentence.
- Omit `Notes` unless the task has non-obvious constraints, decisions, or dependencies. Reference authoritative project documents instead of summarizing them.
- List each changed path once in `Scope`; group paths that receive the same change.
- Keep steps independently actionable. Put verification only in `Checks`.
- Use exact commands, behaviors, or assertions in `Checks`. Every task has at least one check that can go red.
- Give code tasks `Seams`: the public interfaces where tests observe behaviour. Omit it for tasks with no code under test.
- Write `Handoff` only when work stops unfinished, with only the applicable fields. Before writing it, stop at a green unit boundary or back out of the current unit, and make the work durable: a `wip:` commit in the main checkout when commits are authorized, otherwise leave the changes uncommitted and say so under `State`.
- Make each task independently resumable from its goal, notes, scope, steps, and checks.
