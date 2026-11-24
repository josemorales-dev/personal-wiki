````md
# Proposed Changes

## `AGENTS.md`

### Insert after L33

```diff
 Combine skills when their concerns overlap and follow their referenced documents
 rather than duplicating those rules here.
+
+## Planning
+
+Every coding change goes through a session run by `agents-coding-workflow`:
+`PLAN.md`, `SCRATCH-TESTS.md`, and `SCRATCH-CODE.md`, approved together before
+any code is written. The one exception is a small, clear change, which aligns in
+one line of the reply. The rule holds on every route, including tickets built
+with `/implement` or `/implement-spec`.
+
+| Size                   | Route                                                                                                                  |
+| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
+| Small, clear change    | Align in one line of the reply; no session.                                                                            |
+| Fits one session       | One session.                                                                                                           |
+| Spans several sessions | `/grill-with-docs` → `/to-spec` → `/to-tickets`; each ticket is one session, built with `/implement` or `/implement-spec`. |
+| Too foggy to spec      | `/wayfinder` until the destination is a spec, then the row above.                                                      |
+
+Slash commands are user-typed: name the command and ask the user to run it.
```

## `.agents/skills/agents-coding-workflow/SKILL.md`

### Replace L14–L22

```diff
-Each step ends on its completion criterion. Move to the next step only once it holds.
+Take the route from **Planning** in the hub `AGENTS.md`. Each step ends on its completion criterion. Move to the next step only once it holds.
 
-1. **Align.** For ambiguous, cross-module, or multi-step work, run `grill-with-docs` (or `to-spec` when a spec is wanted). Done when the goal, the seams under test, and the checks are agreed and written in `PLAN.md`. A small, unambiguous change aligns in one line of your reply.
-2. **Approve.** For a session, present `PLAN.md` and `SCRATCH.md` together as one approval. Done when the user approves both. Small changes skip this step unless the project mandates it.
-3. **Route.** A bug or regression goes to `diagnosing-bugs`; new or changed behaviour goes to `tdd`; a question about module shape or seam placement goes to `codebase-design`.
-4. **Build in verifiable units.** Each unit is red → green → refactor: a failing check, the smallest change that turns it green, then cleanup with the check still green. Done when every unit in `Scope` is green; start the next unit only from a green state.
-5. **Prove it works.** Run the plan's `Checks` this turn against the real artifact and quote their output: typecheck and single test files during the work, the full suite once at the end. A bug fix shows the reproduction failing before the fix and passing after. Done when every check has quoted output from this turn; "it compiles" and earlier runs are proxies, not proof.
-6. **Review.** Run `code-review` against the spec and standards. When the change touches shared code, name what else could break and the fact that makes it safe. Done when every finding is fixed or reported as a known limitation.
-7. **Ship.** Commit or open a PR only when authorized (see Git). Report the result, remaining limitations, and changed paths.
+1. **Align.** For ambiguous, cross-module, or multi-step work, grill the user: load `grilling` and `domain-modeling`, or ask the user to type `/grill-with-docs` (or `/to-spec` when a spec is wanted). Done when the goal, the seams under test, and the checks are agreed and written in `PLAN.md`. A small, unambiguous change aligns in one line of your reply.
+2. **Research.** When the code the goal touches is unfamiliar, explore it and write `RESEARCH.md` in the session folder: the files, flows, and constraints involved, as `path:line` pointers. Done when every path in the plan's `Scope` traces to a finding.
+3. **Approve.** Every change except a small, clear one is a session: present `PLAN.md`, `SCRATCH-TESTS.md`, and `SCRATCH-CODE.md` together as one approval, and write code only after it. Done when the user approves all three. A small, clear change skips this step.
+4. **Route.** A bug or regression goes to `diagnosing-bugs`; new or changed behaviour goes to `tdd`; a question about module shape or seam placement goes to `codebase-design`.
+5. **Build in verifiable units.** Each unit is red → green → refactor: a failing check, the smallest change that turns it green, then cleanup with the check still green. Refactor inside each unit, before the next red, even where `tdd` places refactoring at review. Done when every unit in `Scope` is green; start the next unit only from a green state.
+6. **Prove it works.** Run the plan's `Checks` this turn against the real artifact and quote their output: typecheck and single test files during the work, the full suite once at the end. A bug fix shows the reproduction failing before the fix and passing after. Done when every check has quoted output from this turn; "it compiles" and earlier runs are proxies, not proof.
+7. **Review.** Run `code-review` against the spec and standards. When the change touches shared code, name what else could break and the fact that makes it safe. Done when every finding is fixed or reported as a known limitation.
+8. **Spot-check.** Pick the 2–3 places in the diff most worth human eyes, each as `path:line` with the risk it carries and the check that covers it. Done when the list is in the final report.
+9. **Ship.** Commit or open a PR only when authorized (see Git). Report the result, the spot-check list, remaining limitations, and changed paths.
+10. **Learn.** When a mistake recurred, or review or a check let one through, suggest the user run `/retro`; a mechanical mistake becomes a lint rule, test, or hook. Done when the suggestion is made, or no mistake recurred.
```

### Replace L28–L34

```diff
-Use a session when work is substantial or requires handoff: `PLAN.md` and `SCRATCH.md` under the selected project's `.agents/sessions/<session-id>/`, tracked in `.agents/CONTROLS.md`. Read the formats before writing them:
+Use a session for every change except a small, clear one: `PLAN.md`, `SCRATCH-TESTS.md`, and `SCRATCH-CODE.md` under the selected project's `.agents/sessions/<session-id>/`, tracked in `.agents/CONTROLS.md`. Read the formats before writing them:
 
 - [references/PLAN-FORMAT.md](references/PLAN-FORMAT.md): session plans and handoff.
-- [references/SCRATCH-FORMAT.md](references/SCRATCH-FORMAT.md): the exact changes, approved together with the plan.
+- [references/SCRATCH-FORMAT.md](references/SCRATCH-FORMAT.md): the exact test and code changes, approved together with the plan.
 - [references/CONTROLS-FORMAT.md](references/CONTROLS-FORMAT.md): active session tracking.
 
-Resuming a session: its `PLAN.md`, `SCRATCH.md`, and Git history are the authoritative trail. Reconstruct state from them, continue from the handoff's `Next`, and re-run only the checks the remaining work touches.
+Resuming a session: its `PLAN.md`, scratch files, and Git history are the authoritative trail. Reconstruct state from them, continue from the handoff's `Next`, and re-run only the checks the remaining work touches.
```

### Replace L46

```diff
-- Commit when requested or when the project workflow authorizes it; implementation alone does not imply a commit.
+- Commit when requested or when the project workflow authorizes it; implementation alone does not imply a commit. A user-typed `/implement` or `/implement-spec` authorizes the commits those skills make.
```

## `.agents/skills/agents-coding-workflow/references/SCRATCH-FORMAT.md`

### Replace L1–L6

```diff
-# SCRATCH.md Format
+# Scratch Files Format
 
-`SCRATCH.md` is the exact content proposal. It is presented together with
-`PLAN.md` as one approval, before any change is applied: the plan says what
-and why, the scratch shows how. Keep it small enough to review while making
-every intended content change explicit.
+A session's exact content proposal is split in two scratch files:
+`SCRATCH-TESTS.md` holds the test changes and `SCRATCH-CODE.md` holds every
+other content change (source, config, docs). Both are presented together with
+`PLAN.md` as one approval, before any change is applied: the plan says what and
+why, the tests say how behaviour is checked, the code shows how it is built.
+Omit `SCRATCH-TESTS.md` when the work has no tests. Keep each file small enough
+to review while making every intended content change explicit. Both files use
+the structure below.
```

### Replace L48–L50

```diff
-- Give every content target in the plan's `Scope` one `##` section with its
-  exact repository-relative path. Do not include normal controls, session, or
-  archive bookkeeping.
+- Title `SCRATCH-TESTS.md` `# Proposed Tests` and `SCRATCH-CODE.md`
+  `# Proposed Changes`.
+- Give every content target in the plan's `Scope` one `##` section with its
+  exact repository-relative path, in the file that matches it: test files in
+  `SCRATCH-TESTS.md`, everything else in `SCRATCH-CODE.md`. Do not include
+  normal controls, session, or archive bookkeeping.
```

### Replace L67–L74

```diff
 - Keep validation output, implementation notes, and ordinary session cleanup
-  out of `SCRATCH.md`; those belong in the plan or final report.
-- In test-first work, list the tests first, then the code that turns them
-  green.
+  out of the scratch files; those belong in the plan or final report.
+- Order `SCRATCH-TESTS.md` in the slice order the build follows, one tracer
+  bullet per unit.
 - If implementation must differ materially from the approved proposal, update
-  `PLAN.md` and `SCRATCH.md` and request approval again before applying the
-  difference. Refactors inside the approved scope that keep the checks green are
-  not material.
+  `PLAN.md` and the affected scratch file and request approval again before
+  applying the difference. Refactors inside the approved scope that keep the
+  checks green are not material.
```

## `.agents/skills/agents-coding-workflow/references/CONTROLS-FORMAT.md`

### Replace L11–L18

```diff
-| Session | Plan | Scratch |
-| ------- | ---- | ------- |
+| Session | Plan | Tests | Code |
+| ------- | ---- | ----- | ---- |
 
 ## Fields
 
 - `Session` — unique lowercase kebab-case session id
 - `Plan` — path to `.agents/sessions/<session-id>/PLAN.md`
-- `Scratch` — path to `.agents/sessions/<session-id>/SCRATCH.md`
+- `Tests` — path to `.agents/sessions/<session-id>/SCRATCH-TESTS.md`, or `—` when the session has no tests
+- `Code` — path to `.agents/sessions/<session-id>/SCRATCH-CODE.md`
```
````
