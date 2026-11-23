# Workflow

Read [the shared path rules](../../PATHS.md) and the selected project's local instructions before changes. Bundled formats are relative to this file: [controls](CONTROLS-FORMAT.md), [plans](PLAN-FORMAT.md), and [proposals](SCRATCH-FORMAT.md). Engineering standards live in the discovered `agents-code-standards` skill.

## Authorization and scope

Carry out changes the user has authorized. An audit or review alone authorizes inspection and findings; an explicit request to fix or implement authorizes the scoped edits. Ask only for missing information, genuinely consequential approval, or a specific applicable project requirement.

Use a session when work is substantial or requires handoff: `PLAN.md` and `SCRATCH.md` under the selected project's `.agents/sessions/<session-id>/`, tracked in `.agents/CONTROLS.md`. A session's `SCRATCH.md` is its approval point; apply it once the user approves it. Small changes do not require bookkeeping unless the project mandates it. Approval requirements in applicable project instructions remain in force.

## Project state

Use existing project conventions for documentation, memory, issues, and ADRs. If adopting the `.agents/` convention, project context goes in `.agents/docs/PROJECT_CONTEXT.md`, supplemental memory in `.agents/MEMORY.md` and `.agents/memories/`, and archived sessions in `.agents/archive/sessions/`. Read only relevant current memory. Use `remember` for curation; archive completed session state after retaining durable facts and removing its controls entry. An absent file does not require copying global or unrelated project state.

## Git policy

Use Git read operations to inspect the selected checkout. Follow the user's request and applicable project rules for branches, commits, and pull requests. Implementation alone does not require an automatic commit. Commit only when requested or when the established project workflow authorizes it; stage only intended task changes. Preserve pre-existing and concurrent work. Resolve conflicts before proceeding. Avoid destructive resets and broad cleanup; use targeted edits that preserve unrelated changes. Publishing, merging, force pushes, and other consequential actions require appropriate authorization.

## Verification

Run checks appropriate to the change and project. Report the result, remaining limitations, and relevant file paths. Do not repeat successful checks without a new change or unresolved concern.
