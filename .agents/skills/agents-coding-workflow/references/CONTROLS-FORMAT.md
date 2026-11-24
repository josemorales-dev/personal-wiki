# CONTROLS.md Format

Use one row per active session.

Remove the row during cleanup before moving the completed session to
`.agents/archive/sessions/<session-id>/`. Never point controls at
`.agents/memories/` or `.agents/archive/`.

## Structure

| Session | Plan | Tests | Code |
| ------- | ---- | ----- | ---- |

## Fields

- `Session` — unique lowercase kebab-case session id
- `Plan` — path to `.agents/sessions/<session-id>/PLAN.md`
- `Tests` — path to `.agents/sessions/<session-id>/SCRATCH-TESTS.md`, or `—` when the session has no tests
- `Code` — path to `.agents/sessions/<session-id>/SCRATCH-CODE.md`
