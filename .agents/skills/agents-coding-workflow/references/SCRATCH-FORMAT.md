# Scratch files format

A session's exact content proposal is split in two scratch files.
`SCRATCH-TESTS.md` holds the test changes. `SCRATCH-CODE.md` holds every other
content change, such as source, config, and docs. Both are presented together
with `PLAN.md` as one approval, before any change is applied. The plan says
what and why, the tests say how behaviour is checked, and the code shows how it
is built. Omit `SCRATCH-TESTS.md` when the work has no tests. Keep each file
small enough to review while making every intended content change explicit.
Both files use the structure below.

## Structure

````md
# Proposed changes

## `path/to/existing-file`

### Replace L42 to L57

```diff
 unchanged context
-old content
+new content
 unchanged context
```

### Insert after L80

```diff
 existing anchor
+inserted content
 next existing line
```

## `path/to/new-file`

### New file

```text
Complete proposed contents of the new file.
```

## Files to delete

- `path/to/obsolete-file`, entire file, L1 to L88
````

## Rules

- Title `SCRATCH-TESTS.md` `# Proposed tests` and `SCRATCH-CODE.md`
  `# Proposed changes`.
- Give every content target in the plan's `Scope` one `##` section with its
  exact repository-relative path. Put test files in `SCRATCH-TESTS.md` and
  everything else in `SCRATCH-CODE.md`. Do not include normal controls,
  session, or archive bookkeeping.
- Give each change a `###` operation heading. Use one of:
  - `Insert before L<n>` or `Insert after L<n>`
  - `Replace L<n> to L<n>`
  - `Delete L<n> to L<n>`
  - `New file`
  - `Rename from path/to/old-file`
  - `New symlink to path/to/target`
- Line numbers refer to the original file when the proposal is prepared.
- Show existing-file changes as focused `diff` snippets. Include enough
  unchanged context to locate each hunk, and show removed and added lines
  explicitly. The snippets need not be directly applicable patches.
- Do not show an entire existing file, use ellipses inside a hunk, or replace
  exact content with a prose summary. New files are the whole-file exception.
- Use an outer fence longer than any fence contained in the proposed content.
- List whole-file removals under `## Files to delete` with the original full
  line range. Do not reproduce the deleted file.
- Keep validation output, implementation notes, and ordinary session cleanup
  out of the scratch files; those belong in the plan or final report.
- Order `SCRATCH-TESTS.md` in the slice order the build follows, one tracer
  bullet per unit.
- If implementation must differ materially from the approved proposal, update
  `PLAN.md` and the affected scratch file and request approval again before
  applying the difference. Refactors inside the approved scope that keep the
  checks green are not material.
