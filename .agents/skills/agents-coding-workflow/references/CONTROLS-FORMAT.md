# CONTROLS.md Format

Use one row per active session.

Remove the row during cleanup before moving the completed session to
`.agents/archive/sessions/<session-id>/`. Never point controls at
`.agents/memories/` or `.agents/archive/`.

## Structure

| Session | Plan | Scratch |
| ------- | ---- | ------- |

## Fields

- `Session` — unique lowercase kebab-case session id
- `Plan` — path to `.agents/sessions/<session-id>/PLAN.md`
- `Scratch` — path to `.agents/sessions/<session-id>/SCRATCH.md`
