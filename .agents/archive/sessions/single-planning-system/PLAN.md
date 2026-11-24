# Single Planning System

## Task 1: Join the two planning systems and adopt the revised loop

**Status:** not started
**Goal:** One planning system, routed from `AGENTS.md`, where every coding change except a small, clear one goes through an approved session, run by the revised loop with split scratch files and a human spot-check.
**Notes:**

- Vendored Matt Pocock skills stay untouched; `AGENTS.md` and `agents-coding-workflow` override them where they differ (session approval before `/implement` and `/implement-spec` builds, refactor inside the loop).
- `to-tickets` local fallback (`.scratch/<feature>/issues/`) still differs from `references/issue-tracker.md` (`.agents/issues/`); out of scope, this repo uses GitHub Issues.

**Scope:**

- `AGENTS.md` — new `## Planning` section: session-required rule, size → route table, slash commands are user-typed.
- `.agents/skills/agents-coding-workflow/SKILL.md` — loop becomes Align, Research, Approve, Route, Build, Prove, Review, Spot-check, Ship, Learn; every change except a small, clear one is a session of `PLAN.md`, `SCRATCH-TESTS.md`, `SCRATCH-CODE.md`; refactor inside each unit; `/implement` and `/implement-spec` authorize their commits.
- `.agents/skills/agents-coding-workflow/references/SCRATCH-FORMAT.md` — describe the two scratch files and slice-ordered tests.
- `.agents/skills/agents-coding-workflow/references/CONTROLS-FORMAT.md` — `Tests` and `Code` columns replace `Scratch`.

**Steps:**

1. Apply the changes in `SCRATCH.md`.
2. Remove this session's row from `.agents/CONTROLS.md` and archive the session.

**Checks:**

- `grep -rn 'SCRATCH\.md' AGENTS.md .agents/skills --include='*.md'` — no matches outside this session.
- `grep -rn 'run .grill-with-docs.' .agents/skills/agents-coding-workflow` — no matches.
- `git diff --quiet -- .agents/skills/tdd .agents/skills/implement .agents/skills/implement-spec` — exits 0 (vendored skills untouched).
- `grep -n '^## Planning' AGENTS.md` — one match.
