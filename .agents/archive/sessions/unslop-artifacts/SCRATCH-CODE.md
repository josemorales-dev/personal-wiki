`````md
# Proposed changes

## `.agents/skills/agents-coding-workflow/SKILL.md`

### Insert after L25

```diff
 10. **Learn.** When a mistake recurred, or review or a check let one through, suggest the user run `/retro`; a mechanical mistake becomes a lint rule, test, or hook. Done when the suggestion is made, or no mistake recurred.
+
+## Writing
+
+Every artifact the user reads follows the rules in [unslop](../unslop/SKILL.md): `PLAN.md`, the scratch files, `RESEARCH.md`, the final report, commit messages, PR bodies, and issues. Read the rules before writing the first artifact of a task, and check each artifact against them before presenting it. Verbatim content stays exact: proposed code and diffs, command output, and quotes.
 
 ## Authorization and scope
```

## `.agents/skills/agents-coding-workflow/references/PLAN-FORMAT.md`

### Replace L1 to L40

````diff
-# PLAN.md Format
+# PLAN.md format
 
 Write plans in terse, clear language. Include only information needed to execute, validate, or resume the work.
 
 ## Structure
 
 ```md
 # <Title>
 
 ## Task N: <verb phrase>
 
-**Status:** not started | in progress | done | blocked
-**Goal:** <one sentence describing the required result>
-**Notes:**
+- Status: not started | in progress | done | blocked
+- Goal: <one sentence describing the required result>
+
+Notes:
 
 - <non-obvious constraint, decision, or dependency>
 
-**Scope:**
+Scope:
 
-- `<path>` — <intended change>
+| Path     | Change            |
+| -------- | ----------------- |
+| `<path>` | <intended change> |
 
-**Seams:**
+Seams:
 
-- `<public interface>` — <behaviour the tests observe there>
+| Interface            | Behaviour the tests observe |
+| -------------------- | --------------------------- |
+| `<public interface>` | <behaviour>                 |
 
-**Steps:**
+Steps:
 
 1. <imperative action>
 
-**Checks:**
+Checks:
 
-- `<command>` — <expected result>
+- `<command>` shows <expected result>.
 
 ## Handoff
 
-- **Done:** <completed work, with the checks that proved it>
-- **State:** <branch, last commit, whether the tree is clean or broken>
-- **Next:** <first action on resume>
-- **Blocker:** <reason work cannot continue>
+- Done: <completed work, with the checks that proved it>
+- State: <branch, last commit, whether the tree is clean or broken>
+- Next: <first action on resume>
+- Blocker: <reason work cannot continue>
 ```
````

## `.agents/skills/agents-coding-workflow/references/SCRATCH-FORMAT.md`

### Replace L1 to L10

```diff
-# Scratch Files Format
+# Scratch files format
 
-A session's exact content proposal is split in two scratch files:
-`SCRATCH-TESTS.md` holds the test changes and `SCRATCH-CODE.md` holds every
-other content change (source, config, docs). Both are presented together with
-`PLAN.md` as one approval, before any change is applied: the plan says what and
-why, the tests say how behaviour is checked, the code shows how it is built.
-Omit `SCRATCH-TESTS.md` when the work has no tests. Keep each file small enough
-to review while making every intended content change explicit. Both files use
-the structure below.
+A session's exact content proposal is split in two scratch files.
+`SCRATCH-TESTS.md` holds the test changes. `SCRATCH-CODE.md` holds every other
+content change, such as source, config, and docs. Both are presented together
+with `PLAN.md` as one approval, before any change is applied. The plan says
+what and why, the tests say how behaviour is checked, and the code shows how it
+is built. Omit `SCRATCH-TESTS.md` when the work has no tests. Keep each file
+small enough to review while making every intended content change explicit.
+Both files use the structure below.
```

### Replace L15 to L19

```diff
-# Proposed Changes
+# Proposed changes
 
 ## `path/to/existing-file`
 
-### Replace L42–L57
+### Replace L42 to L57
```

### Replace L44 to L46

```diff
-## Files to Delete
+## Files to delete
 
-- `path/to/obsolete-file` — entire file, L1–L88
+- `path/to/obsolete-file`, entire file, L1 to L88
```

### Replace L51 to L64

```diff
-- Use `# Proposed Changes` as the title.
-- Title `SCRATCH-TESTS.md` `# Proposed Tests` and `SCRATCH-CODE.md`
-  `# Proposed Changes`.
-- Give every content target in the plan's `Scope` one `##` section with its
-  exact repository-relative path, in the file that matches it: test files in
-  `SCRATCH-TESTS.md`, everything else in `SCRATCH-CODE.md`. Do not include
-  normal controls, session, or archive bookkeeping.
+- Title `SCRATCH-TESTS.md` `# Proposed tests` and `SCRATCH-CODE.md`
+  `# Proposed changes`.
+- Give every content target in the plan's `Scope` one `##` section with its
+  exact repository-relative path. Put test files in `SCRATCH-TESTS.md` and
+  everything else in `SCRATCH-CODE.md`. Do not include normal controls,
+  session, or archive bookkeeping.
 - Give each change a `###` operation heading. Use one of:
   - `Insert before L<n>` or `Insert after L<n>`
-  - `Replace L<n>–L<n>`
-  - `Delete L<n>–L<n>`
+  - `Replace L<n> to L<n>`
+  - `Delete L<n> to L<n>`
   - `New file`
   - `Rename from path/to/old-file`
-  - `New symlink → path/to/target`
+  - `New symlink to path/to/target`
```

### Replace L72

```diff
-- List whole-file removals under `## Files to Delete` with the original full
+- List whole-file removals under `## Files to delete` with the original full
```

## `.agents/skills/agents-coding-workflow/references/CONTROLS-FORMAT.md`

### Replace L1

```diff
-# CONTROLS.md Format
+# CONTROLS.md format
```

### Replace L16 to L19

```diff
-- `Session` — unique lowercase kebab-case session id
-- `Plan` — path to `.agents/sessions/<session-id>/PLAN.md`
-- `Tests` — path to `.agents/sessions/<session-id>/SCRATCH-TESTS.md`, or `—` when the session has no tests
-- `Code` — path to `.agents/sessions/<session-id>/SCRATCH-CODE.md`
+- `Session` holds a unique lowercase kebab-case session id.
+- `Plan` holds the path to `.agents/sessions/<session-id>/PLAN.md`.
+- `Tests` holds the path to `.agents/sessions/<session-id>/SCRATCH-TESTS.md`, or `none` when the session has no tests.
+- `Code` holds the path to `.agents/sessions/<session-id>/SCRATCH-CODE.md`.
```
`````
