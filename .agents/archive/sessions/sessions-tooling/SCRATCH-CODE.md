# Proposed changes

## `.agents/tools/sessions/worktree.ts`

### Replace

```diff
+import { cpSync, mkdirSync } from "node:fs";
 import { basename, dirname, join } from "node:path";
```

### Insert

```diff
 export function addWorktree(repo: string, path: string, branch: string, base: string): GitOutcome {
   return git(repo, ["worktree", "add", "-b", branch, path, base]);
 }
+
+/**
+ * Copies the repository's uncommitted changes, staged or not, and its untracked files that Git does not ignore into
+ * `worktree`, where they stay uncommitted. Returns the carried paths, sorted.
+ */
+export function carryUncommitted(repo: string, worktree: string): Parsed<readonly string[]> {
+  const changed = git(repo, ["diff", "HEAD", "--name-only", "-z"]);
+  if (!changed.ok) return { ok: false, error: changed.error };
+  const untracked = git(repo, ["ls-files", "--others", "--exclude-standard", "-z"]);
+  if (!untracked.ok) return { ok: false, error: untracked.error };
+  const changedPaths = nulSeparated(changed.output);
+  if (changedPaths.length > 0) {
+    const patch = Bun.spawnSync(["git", "-C", repo, "diff", "HEAD", "--binary"], { stdout: "pipe", stderr: "pipe" });
+    const applied = Bun.spawnSync(["git", "-C", worktree, "apply", "--binary", "-"], {
+      stdin: patch.stdout,
+      stdout: "pipe",
+      stderr: "pipe",
+    });
+    if (patch.exitCode !== 0 || applied.exitCode !== 0) {
+      return { ok: false, error: `${patch.stderr.toString()}${applied.stderr.toString()}`.trim() };
+    }
+  }
+  const untrackedPaths = nulSeparated(untracked.output);
+  for (const path of untrackedPaths) {
+    mkdirSync(dirname(join(worktree, path)), { recursive: true });
+    cpSync(join(repo, path), join(worktree, path), { verbatimSymlinks: true });
+  }
+  return { ok: true, value: [...new Set([...changedPaths, ...untrackedPaths])].sort() };
+}
+
+function nulSeparated(output: string): readonly string[] {
+  return output.split("\0").filter((path) => path !== "");
+}
```

## `.agents/tools/sessions/format-check.ts`

### New file

````ts
/** A rule of PLAN-FORMAT.md or SCRATCH-FORMAT.md that a session file breaks. */
export type FormatProblem = { readonly file: string; readonly line: number; readonly message: string };

const PLAN = "PLAN.md";
const TESTS = "SCRATCH-TESTS.md";
const CODE = "SCRATCH-CODE.md";
const FILES_TO_DELETE = "Files to delete";
const TASK_STATUSES: readonly string[] = ["not started", "in progress", "done", "blocked"];
const OPERATIONS: readonly RegExp[] = [
  /^Insert$/,
  /^Replace$/,
  /^Delete$/,
  /^New file$/,
  /^Rename from \S+$/,
  /^New symlink to \S+$/,
];

type Line = { readonly number: number; readonly text: string };
type Heading = { readonly level: number; readonly title: string };
type PathMention = { readonly file: string; readonly line: number; readonly path: string };
type FileCheck = { readonly problems: readonly FormatProblem[]; readonly paths: readonly PathMention[] };

/**
 * Checks a session's PLAN.md and scratch files against the mechanical rules of their formats. `read` returns a
 * file's text by name, or undefined when the session has no such file.
 */
export function checkSessionFormat(read: (fileName: string) => string | undefined): readonly FormatProblem[] {
  const plan = read(PLAN);
  const tests = read(TESTS);
  const code = read(CODE);
  const missing = [
    ...(plan === undefined ? [missingFile(PLAN)] : []),
    ...(code === undefined ? [missingFile(CODE)] : []),
  ];
  const planCheck = plan === undefined ? undefined : checkPlan(plan);
  const scratchChecks = [
    ...(tests === undefined ? [] : [checkScratch(TESTS, "# Proposed tests", tests)]),
    ...(code === undefined ? [] : [checkScratch(CODE, "# Proposed changes", code)]),
  ];
  const sections = scratchChecks.flatMap((check) => check.paths);
  return [
    ...missing,
    ...(planCheck?.problems ?? []),
    ...scratchChecks.flatMap((check) => check.problems),
    ...(planCheck === undefined ? [] : scopeMismatches(planCheck.paths, sections)),
  ];
}

function missingFile(file: string): FormatProblem {
  return { file, line: 1, message: "file is missing" };
}

function checkPlan(text: string): FileCheck {
  const lines = proseLines(text);
  const problems: FormatProblem[] = [];
  const paths: PathMention[] = [];
  const report = (line: number, message: string): void => {
    problems.push({ file: PLAN, line, message });
  };
  const first = lines.find((line) => line.text.trim() !== "");
  if (first === undefined || !/^# \S/.test(first.text)) report(first?.number ?? 1, "first line must be '# <Title>'");
  const sectionStarts = lines.flatMap((line, index) => (headingOf(line)?.level === 2 ? [index] : []));
  if (sectionStarts.length === 0) report(1, "plan has no '## Task N: <verb phrase>' section");
  sectionStarts.forEach((start, position) => {
    const headingLine = lines[start];
    const heading = headingLine === undefined ? undefined : headingOf(headingLine);
    if (headingLine === undefined || heading === undefined || heading.title === "Handoff") return;
    if (!/^Task \d+: \S/.test(heading.title)) {
      report(headingLine.number, `'## ${heading.title}' must be '## Task N: <verb phrase>' or '## Handoff'`);
      return;
    }
    const body = lines.slice(start + 1, sectionStarts[position + 1] ?? lines.length);
    const status = body.find((line) => line.text.startsWith("- Status:"));
    if (status === undefined) report(headingLine.number, "task has no '- Status:' line");
    else {
      const value = status.text.slice("- Status:".length).trim();
      if (!TASK_STATUSES.includes(value)) {
        report(status.number, `unknown status '${value}'; use not started, in progress, done, or blocked`);
      }
    }
    if (!body.some((line) => /^- Goal: \S/.test(line.text))) report(headingLine.number, "task has no '- Goal:' line");
    for (const label of ["Scope:", "Checks:"]) {
      if (!body.some((line) => line.text === label)) report(headingLine.number, `task has no '${label}' line`);
    }
    paths.push(...scopePaths(body));
  });
  return { problems, paths };
}

/** The backticked paths in the first column of the task's Scope table. */
function scopePaths(body: readonly Line[]): readonly PathMention[] {
  const label = body.findIndex((line) => line.text === "Scope:");
  if (label === -1) return [];
  const paths: PathMention[] = [];
  for (const line of body.slice(label + 1)) {
    if (line.text.trim() === "") continue;
    if (!line.text.startsWith("|")) break;
    const firstCell = line.text.split("|")[1] ?? "";
    for (const match of firstCell.matchAll(/`([^`]+)`/g)) {
      const path = match[1];
      if (path !== undefined) paths.push({ file: PLAN, line: line.number, path });
    }
  }
  return paths;
}

function checkScratch(file: string, title: string, text: string): FileCheck {
  const lines = proseLines(text);
  const problems: FormatProblem[] = [];
  const paths: PathMention[] = [];
  const report = (line: number, message: string): void => {
    problems.push({ file, line, message });
  };
  const first = lines.find((line) => line.text.trim() !== "");
  if (first?.text !== title) report(first?.number ?? 1, `first line must be '${title}'`);
  let section: "none" | "path" | "delete" = "none";
  for (const line of lines.slice(1)) {
    const heading = headingOf(line);
    if (heading?.level === 2) {
      const path = backtickedPath(heading.title);
      if (heading.title === FILES_TO_DELETE) section = "delete";
      else if (path === undefined) {
        report(line.number, `'## ${heading.title}' must be a backticked path or 'Files to delete'`);
        section = "none";
      } else {
        paths.push({ file, line: line.number, path });
        section = "path";
      }
    } else if (heading?.level === 3) {
      if (section !== "path") report(line.number, `'### ${heading.title}' must sit under a '## \`path\`' section`);
      else if (!OPERATIONS.some((operation) => operation.test(heading.title))) {
        report(
          line.number,
          `unknown operation '${heading.title}'; use Insert, Replace, Delete, New file, Rename from <path>, or New symlink to <path>`,
        );
      }
    } else if (section === "delete" && line.text.trim() !== "") {
      const deleted = /^- `([^`]+)`$/.exec(line.text)?.[1];
      if (deleted === undefined) report(line.number, "list a deleted file as '- `path`' with nothing after it");
      else paths.push({ file, line: line.number, path: deleted });
    }
  }
  return { problems, paths };
}

function scopeMismatches(scope: readonly PathMention[], sections: readonly PathMention[]): readonly FormatProblem[] {
  const sectionPaths = new Set(sections.map((section) => section.path));
  const scopePathSet = new Set(scope.map((entry) => entry.path));
  return [
    ...scope
      .filter((entry) => !sectionPaths.has(entry.path))
      .map((entry) => ({
        file: entry.file,
        line: entry.line,
        message: `\`${entry.path}\` is in Scope but has no section in the scratch files`,
      })),
    ...sections
      .filter((section) => !scopePathSet.has(section.path))
      .map((section) => ({
        file: section.file,
        line: section.line,
        message: `\`${section.path}\` is not in the plan's Scope`,
      })),
  ];
}

/**
 * The lines outside fenced code blocks, so proposed content never reads as structure. A fence closes only on the same
 * character repeated at least as many times, which lets a longer fence hold a shorter one.
 */
function proseLines(text: string): readonly Line[] {
  const lines: Line[] = [];
  let fence: string | undefined;
  text.split("\n").forEach((content, index) => {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(content);
    const run = marker?.[1];
    if (fence === undefined) {
      if (run === undefined) lines.push({ number: index + 1, text: content });
      else fence = run;
      return;
    }
    const closes =
      run !== undefined && run.startsWith(fence.charAt(0)) && run.length >= fence.length && marker?.[2]?.trim() === "";
    if (closes) fence = undefined;
  });
  return lines;
}

function headingOf(line: Line): Heading | undefined {
  const match = /^(#{1,6}) +(.+?)\s*$/.exec(line.text);
  const hashes = match?.[1];
  const title = match?.[2];
  return hashes === undefined || title === undefined ? undefined : { level: hashes.length, title };
}

function backtickedPath(title: string): string | undefined {
  return /^`([^`]+)`$/.exec(title)?.[1];
}
````

## `.agents/tools/sessions/cli.ts`

### Replace

```diff
-import { existsSync } from "node:fs";
-import { basename, resolve } from "node:path";
+import { existsSync, readFileSync } from "node:fs";
+import { basename, join, resolve } from "node:path";
 import { parseArgs } from "node:util";
+import { checkSessionFormat } from "./format-check.ts";
 import { cell, fields, paint, relativeAge, STATUS_STYLE, table } from "./report.ts";
```

### Replace

```diff
 import {
   addWorktree,
+  carryUncommitted,
   currentBranch,
```

### Replace

```diff
 Create a worktree for the session beside its project repository, on a new
 branch named after the session, and a session folder in the hub for its plan,
 scratch files, and state.
+
+When the session starts from the current branch, the repository's uncommitted
+changes and untracked files are copied into the new worktree, uncommitted.
+Ignored files are not copied.
```

### Insert

```diff
   sessions start add-login --repo ~/Projects/app --tool claude
 `;
+
+const CHECK_FORMAT_HELP = `Usage: sessions check-format <id>
+
+Check a session's PLAN.md and scratch files against the PLAN and scratch
+formats in agents-coding-workflow: titles, headings, operation names, task
+fields, and that every path in the plan's Scope has a scratch section.
+
+Example:
+  sessions check-format add-login
+`;
```

### Replace

```diff
   { name: "finish", summary: "Remove a merged session's worktree and branch, then archive it", help: FINISH_HELP, run: finish },
+  { name: "check-format", summary: "Check a session's PLAN.md and scratch files against their formats", help: CHECK_FORMAT_HELP, run: checkFormat },
 ];
```

### Replace

```diff
-  const base = values.base ?? expectCommand(currentBranch(repo), "pass the branch or commit to start from with --base <ref>");
+  const current = currentBranch(repo);
+  const base = values.base ?? expectCommand(current, "pass the branch or commit to start from with --base <ref>");
```

### Replace

```diff
   if (!added.ok) {
     store.release(id);
     throw new CommandError(`could not create the worktree: ${added.error}`);
   }
+  const startsFromCurrentBranch = current.ok && current.value === base;
+  const carried = startsFromCurrentBranch
+    ? expectCommand(
+        carryUncommitted(repo, session.worktree),
+        `the worktree exists without the uncommitted changes; copy them by hand or run 'sessions show ${id}'`,
+      )
+    : [];
   const created = view(session, [session], store);
   if (values.json === true) {
-    context.stdout(json(created));
+    context.stdout(json({ ...created, carried }));
     return;
   }
+  const carriedRows: readonly (readonly [string, string])[] =
+    carried.length === 0 ? [] : [["carried", `${carried.length} uncommitted file(s) from ${base}`]];
+  const carriedNote =
+    carried.length === 0
+      ? ""
+      : `\nCarried, uncommitted in the worktree:\n${carried.map((path) => `  ${path}\n`).join("")}` +
+        `Stage only the session's own changes. Before merging, commit or stash the copy on ${base} of any file the session also changed.\n`;
   context.stdout(
     `Started ${paint(context.color, "bold", id)}\n` +
       fields(context.color, [
         ["worktree", created.worktree],
         ["branch", `${created.branch} from ${created.base}`],
         ["folder", created.folder],
+        ...carriedRows,
       ]) +
-      "\nWrite PLAN.md in the folder and make every change in the worktree.\n",
+      carriedNote +
+      "\nWrite PLAN.md in the folder and make every change in the worktree.\n",
   );
 }
```

### Insert

```diff
 function view(session: Session, sessions: readonly Session[], store: SessionStore): SessionView {
```

The function below goes directly before `view`.

```ts
function checkFormat(args: readonly string[], context: Context): void {
  const { positionals } = parseUsage(() =>
    parseArgs({ args: [...args], allowPositionals: true, strict: true, options: {} }),
  );
  const id = expectUsage(parseSessionId(onlyPositional(positionals, "<id>")));
  const store = new SessionStore(context.hubRoot);
  expectCommand(store.load(id), LIST_HINT);
  const folder = store.folder(id);
  const problems = checkSessionFormat((fileName) => {
    const path = join(folder, fileName);
    return existsSync(path) ? readFileSync(path, "utf8") : undefined;
  });
  if (problems.length === 0) {
    context.stdout(`${id}: PLAN.md and scratch files follow the formats\n`);
    return;
  }
  throw new CommandError(
    `${problems.length} format problem(s) in ${folder}\n` +
      problems.map((problem) => `  ${problem.file}:${problem.line}: ${problem.message}`).join("\n"),
    "see references/PLAN-FORMAT.md and references/SCRATCH-FORMAT.md in agents-coding-workflow",
  );
}

```

## `.agents/tools/sessions/package.json`

### Replace

```diff
     "typecheck": "tsc --noEmit",
-    "check": "tsc --noEmit && bun test"
+    "check": "tsc --noEmit && bun test",
+    "link": "mkdir -p ~/.local/bin && ln -sf \"$(pwd)/main.ts\" ~/.local/bin/sessions"
   },
```

## `.agents/skills/agents-coding-workflow/SKILL.md`

### Replace

```diff
-3. **Approve.** Present `PLAN.md`, `SCRATCH-TESTS.md`, and `SCRATCH-CODE.md` together, and write code only after the user approves them. Ask for approval
+3. **Approve.** Run `sessions check-format <id>` and fix what it reports. Present `PLAN.md`, `SCRATCH-TESTS.md`, and `SCRATCH-CODE.md` together, and write code only after the user approves them. Ask for approval
```

### Replace

```diff
-Sessions for every project live in the hub, so one list shows every agent's work on this machine. Manage them with `sessions`, which means `bun ~/Projects/personal-wiki/.agents/tools/sessions/main.ts`; `sessions help` lists its commands.
+Sessions for every project live in the hub, so one list shows every agent's work on this machine. Manage them with the `sessions` command; `sessions help` lists its commands. When `sessions` is not found, run `bun run link` in the hub's `.agents/tools/sessions/` to put it on `PATH`.
```

### Replace

```diff
-- Start: run `sessions start <id> --repo <project> --tool <claude|codex>` before writing `PLAN.md`. It creates the worktree `<project>.worktrees/<id>` on branch `<id>` and the session folder `.agents/sessions/<id>/` in the hub. Write `PLAN.md`, the scratch files, and `RESEARCH.md` in the folder, and make every change and commit in the worktree.
+- Start: run `sessions start <id> --repo <project> --tool <claude|codex>` before writing `PLAN.md`. It creates the worktree `<project>.worktrees/<id>` on branch `<id>` and the session folder `.agents/sessions/<id>/` in the hub. Write `PLAN.md`, the scratch files, and `RESEARCH.md` in the folder, and make every change and commit in the worktree. When the project has uncommitted changes, `start` copies them into the worktree, uncommitted. Stage only the session's own changes, and before merging, commit or stash the project's copy of any file the session also changed.
```
