# Proposed changes

## `.agents/skills/agents-coding-workflow/references/SCRATCH-FORMAT.md`

### Replace L19 to L28

````diff
-### Replace L42 to L57
+### Replace
 
 ```diff
  unchanged context
 -old content
 +new content
  unchanged context
 ```
 
-### Insert after L80
+### Insert
````

### Replace L46

```diff
-- `path/to/obsolete-file`, entire file, L1 to L88
+- `path/to/obsolete-file`
```

### Replace L57 to L72

```diff
 - Give each change a `###` operation heading. Use one of:
-  - `Insert before L<n>` or `Insert after L<n>`
-  - `Replace L<n> to L<n>`
-  - `Delete L<n> to L<n>`
+  - `Insert`
+  - `Replace`
+  - `Delete`
   - `New file`
   - `Rename from path/to/old-file`
   - `New symlink to path/to/target`
-- Line numbers refer to the original file when the proposal is prepared.
 - Show existing-file changes as focused `diff` snippets. Include enough
-  unchanged context to locate each hunk, and show removed and added lines
-  explicitly. The snippets need not be directly applicable patches.
+  unchanged context to match one place in the file, and show removed and
+  added lines explicitly. The context lines locate the hunk, so read a file
+  by search or line range, not whole. The snippets need not be directly
+  applicable patches.
 - Do not show an entire existing file, use ellipses inside a hunk, or replace
   exact content with a prose summary. New files are the whole-file exception.
 - Use an outer fence longer than any fence contained in the proposed content.
-- List whole-file removals under `## Files to delete` with the original full
-  line range. Do not reproduce the deleted file.
+- List whole-file removals under `## Files to delete` by path. Do not
+  reproduce the deleted file.
```

## `.agents/skills/agents-coding-workflow/SKILL.md`

### Replace L16 to L18

```diff
-1. **Align.** For ambiguous, cross-module, or multi-step work, grill the user: load `grilling` and `domain-modeling`, or ask the user to type `/grill-with-docs` (or `/to-spec` when a spec is wanted). Done when the goal, the seams under test, and the checks are agreed and written in `PLAN.md`. A small, unambiguous change aligns in one line of your reply.
-2. **Research.** When the code the goal touches is unfamiliar, explore it and write `RESEARCH.md` in the session folder: the files, flows, and constraints involved, as `path:line` pointers. Done when every path in the plan's `Scope` traces to a finding.
-3. **Approve.** Every change except a small, clear one is a session: present `PLAN.md`, `SCRATCH-TESTS.md`, and `SCRATCH-CODE.md` together as one approval, and write code only after it. Done when the user approves all three. A small, clear change skips this step.
+1. **Align.** For ambiguous, cross-module, or multi-step work, grill the user: load `grilling` and `domain-modeling`, or ask the user to type `/grill-with-docs` (or `/to-spec` when a spec is wanted). Done when the goal, the seams under test, and the checks are agreed and written in `PLAN.md`.
+2. **Research.** When the code the goal touches is unfamiliar, dispatch an `Explore` subagent with the goal and ask for the files, flows, and constraints involved as `path:line` pointers. Write its findings to `RESEARCH.md` in the session folder. Read in full only the files you will change. Done when every path in the plan's `Scope` traces to a finding.
+3. **Approve.** Present `PLAN.md`, `SCRATCH-TESTS.md`, and `SCRATCH-CODE.md` together as one approval, and write code only after it. Done when the user approves all three.
```

### Replace L21

```diff
-6. **Prove it works.** Run the plan's `Checks` this turn against the real artifact and quote their output: typecheck and single test files during the work, the full suite once at the end. A bug fix shows the reproduction failing before the fix and passing after. Done when every check has quoted output from this turn; "it compiles" and earlier runs are proxies, not proof.
+6. **Prove it works.** Run the plan's `Checks` this turn against the real artifact: typecheck and single test files during the work, the full suite once at the end. Quote each check's summary line and every failure, not the full log; pipe long output through `tail` or the runner's quiet reporter. A bug fix shows the reproduction failing before the fix and passing after. Done when every check has quoted output from this turn; "it compiles" and earlier runs are proxies, not proof.
```

### Replace L35

```diff
-Use a session for every change except a small, clear one. Sessions for every project live in the hub, so one list shows every agent's work on this machine. Manage them with `sessions`, which means `bun ~/Projects/personal-wiki/.agents/tools/sessions/main.ts`; `sessions help` lists its commands.
+Sessions for every project live in the hub, so one list shows every agent's work on this machine. Manage them with `sessions`, which means `bun ~/Projects/personal-wiki/.agents/tools/sessions/main.ts`; `sessions help` lists its commands.
```

## `.agents/skills/agents-code-standards/SKILL.md`

### Delete L5 to L6

```diff
 ---
-
-Read [skill resource and project path rules](../PATHS.md) before applying this skill.
 
 # Code standards
```

## `.agents/skills/agents-language-standards/SKILL.md`

### Delete L5 to L6

```diff
 ---
-
-Read [skill resource and project path rules](../PATHS.md) before applying this skill.
 
 # Programming language standards
```

### Replace L10

```diff
-Identify every programming language touched by the task. Read each matching reference completely before inspecting or changing that language's code or configuration.
+Identify every programming language touched by the task. Read each matching reference completely before writing or reviewing that language's code or configuration. Reading code to explore it does not need the reference.
```

## `.agents/skills/agents-coding-workflow/SKILL.md` (Task 2)

These hunks follow the new format: context lines place them, with no line numbers.

### Replace

```diff
-3. **Approve.** Present `PLAN.md`, `SCRATCH-TESTS.md`, and `SCRATCH-CODE.md` together as one approval, and write code only after it. Done when the user approves all three.
+3. **Approve.** Present `PLAN.md`, `SCRATCH-TESTS.md`, and `SCRATCH-CODE.md` together, and write code only after the user approves them. Ask for approval as its own yes-or-no question that names the session and the files it covers, and put any other decision in a separate question. Only a yes to that question is approval. Done when the user approves all three.
```

### Replace

```diff
-7. **Review.** Run `code-review` against the spec and standards. When the change touches shared code, name what else could break and the fact that makes it safe. Done when every finding is fixed or reported as a known limitation.
+7. **Review.** For a code change, run `code-review` against the spec and standards. For a change to instructions or docs only, such as a skill, `AGENTS.md`, or a format reference, review the diff yourself against `writing-for-agents` and unslop. When the change touches shared code, name what else could break and the fact that makes it safe. Done when every finding is fixed or reported as a known limitation.
```
