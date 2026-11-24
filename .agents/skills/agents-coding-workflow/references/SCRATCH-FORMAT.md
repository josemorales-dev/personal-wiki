# SCRATCH.md Format

`SCRATCH.md` is the exact content proposal. It is presented together with
`PLAN.md` as one approval, before any change is applied: the plan says what
and why, the scratch shows how. Keep it small enough to review while making
every intended content change explicit.

## Structure

````md
# Proposed Changes

## `path/to/existing-file`

### Replace L42–L57

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

## Files to Delete

- `path/to/obsolete-file` — entire file, L1–L88
````

## Rules

- Use `# Proposed Changes` as the title.
- Give every content target in the plan's `Scope` one `##` section with its
  exact repository-relative path. Do not include normal controls, session, or
  archive bookkeeping.
- Give each change a `###` operation heading. Use one of:
  - `Insert before L<n>` or `Insert after L<n>`
  - `Replace L<n>–L<n>`
  - `Delete L<n>–L<n>`
  - `New file`
  - `Rename from path/to/old-file`
  - `New symlink → path/to/target`
- Line numbers refer to the original file when the proposal is prepared.
- Show existing-file changes as focused `diff` snippets. Include enough
  unchanged context to locate each hunk, and show removed and added lines
  explicitly. The snippets need not be directly applicable patches.
- Do not show an entire existing file, use ellipses inside a hunk, or replace
  exact content with a prose summary. New files are the whole-file exception.
- Use an outer fence longer than any fence contained in the proposed content.
- List whole-file removals under `## Files to Delete` with the original full
  line range. Do not reproduce the deleted file.
- Keep validation output, implementation notes, and ordinary session cleanup
  out of `SCRATCH.md`; those belong in the plan or final report.
- In test-first work, list the tests first, then the code that turns them
  green.
- If implementation must differ materially from the approved proposal, update
  `PLAN.md` and `SCRATCH.md` and request approval again before applying the
  difference. Refactors inside the approved scope that keep the checks green are
  not material.
