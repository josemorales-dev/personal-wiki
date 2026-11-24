# Proposed tests

## `.agents/tools/sessions/sessions.test.ts`

### Replace

```diff
-    for (const command of ["start", "list", "show", "update", "finish"]) {
+    for (const command of ["start", "list", "show", "update", "finish", "check-format"]) {
```

### Insert

```diff
   test("frees the id when the worktree cannot be created", () => {
```

The four tests below go at the end of `describe("start")`, after the test above.

```ts
  test("copies uncommitted, staged, and untracked files into the worktree without committing them", () => {
    const repo = projectRepository();
    writeFileSync(join(repo, "README.md"), "app, edited\n");
    writeFileSync(join(repo, "staged.md"), "staged\n");
    git(repo, "add", "staged.md");
    mkdirSync(join(repo, "notes"));
    writeFileSync(join(repo, "notes", "draft.md"), "draft\n");
    const c = cli();
    expect(c.sessions("start", "add-login", "--repo", repo, "--tool", "claude", "--json")).toBe(0);
    expect(c.json()).toMatchObject({ carried: ["README.md", "notes/draft.md", "staged.md"] });
    const worktree = worktreeOf(repo, "add-login");
    expect(readFileSync(join(worktree, "README.md"), "utf8")).toBe("app, edited\n");
    expect(readFileSync(join(worktree, "staged.md"), "utf8")).toBe("staged\n");
    expect(readFileSync(join(worktree, "notes", "draft.md"), "utf8")).toBe("draft\n");
    expect(git(worktree, "rev-list", "--count", "HEAD")).toBe("1");
    expect(git(repo, "status", "--porcelain")).toContain("README.md");
  });

  test("lists the carried files and how to merge around them", () => {
    const repo = projectRepository();
    writeFileSync(join(repo, "README.md"), "app, edited\n");
    const c = cli();
    start(c, repo, "add-login");
    expect(c.stdout()).toContain("README.md");
    expect(c.stdout()).toContain("Stage only the session's own changes");
  });

  test("carries nothing when --base names another branch", () => {
    const repo = projectRepository();
    git(repo, "branch", "release");
    writeFileSync(join(repo, "README.md"), "app, edited\n");
    const c = cli();
    expect(
      c.sessions("start", "add-login", "--repo", repo, "--tool", "claude", "--base", "release", "--json"),
    ).toBe(0);
    expect(c.json()).toMatchObject({ carried: [] });
    expect(readFileSync(join(worktreeOf(repo, "add-login"), "README.md"), "utf8")).toBe("app\n");
  });

  test("carries nothing from a clean repository", () => {
    const repo = projectRepository();
    const c = cli();
    expect(c.sessions("start", "add-login", "--repo", repo, "--tool", "claude", "--json")).toBe(0);
    expect(c.json()).toMatchObject({ carried: [] });
    expect(c.sessions("start", "add-logout", "--repo", repo, "--tool", "claude")).toBe(0);
    expect(c.stdout()).not.toContain("carried");
  });
```

### Insert

A new `describe` block at the end of the file.

```ts
describe("check-format", () => {
  function writeSessionFile(c: Cli, id: string, name: string, lines: readonly string[]): void {
    writeFileSync(join(c.hub, ".agents", "sessions", id, name), `${lines.join("\n")}\n`);
  }

  function startWithPlan(c: Cli, id: string): void {
    start(c, projectRepository(), id);
    writeSessionFile(c, id, "PLAN.md", [
      "# Add login",
      "",
      "## Task 1: Add the form",
      "",
      "- Status: not started",
      "- Goal: Users sign in.",
      "",
      "Scope:",
      "",
      "| Path | Change |",
      "| --- | --- |",
      "| `src/login.ts` | New form. |",
      "",
      "Checks:",
      "",
      "- `bun test` passes.",
    ]);
  }

  test("confirms a session whose files follow the formats", () => {
    const c = cli();
    startWithPlan(c, "add-login");
    writeSessionFile(c, "add-login", "SCRATCH-CODE.md", [
      "# Proposed changes",
      "",
      "## `src/login.ts`",
      "",
      "### New file",
      "",
      "```ts",
      "export const login = true;",
      "```",
    ]);
    expect(c.sessions("check-format", "add-login")).toBe(0);
    expect(c.stdout()).toContain("follow the formats");
  });

  test("lists each problem with its file and line, and fails", () => {
    const c = cli();
    startWithPlan(c, "add-login");
    writeSessionFile(c, "add-login", "SCRATCH-CODE.md", [
      "# Proposed changes",
      "",
      "## `src/login.ts`",
      "",
      "### Replace L1 to L2",
    ]);
    expect(c.sessions("check-format", "add-login")).toBe(1);
    expect(c.stderr()).toContain("SCRATCH-CODE.md:5: unknown operation 'Replace L1 to L2'");
  });

  test("fails for a session that does not exist", () => {
    const c = cli();
    expect(c.sessions("check-format", "ghost")).toBe(1);
  });
});
```

## `.agents/tools/sessions/format-check.test.ts`

### New file

`````ts
import { describe, expect, test } from "bun:test";
import { checkSessionFormat, type FormatProblem } from "./format-check.ts";

const PLAN = [
  "# Add login",
  "",
  "## Task 1: Add the login form",
  "",
  "- Status: not started",
  "- Goal: Users sign in with their email.",
  "",
  "Scope:",
  "",
  "| Path | Change |",
  "| --- | --- |",
  "| `src/login.ts`, `docs/guide.md` | New form and its guide. |",
  "| `src/login.test.ts` | Tests for the form. |",
  "",
  "Checks:",
  "",
  "- `bun test` passes.",
].join("\n");

const TESTS = [
  "# Proposed tests",
  "",
  "## `src/login.test.ts`",
  "",
  "### New file",
  "",
  "```ts",
  'test("signs in", () => {});',
  "```",
].join("\n");

const CODE = [
  "# Proposed changes",
  "",
  "## `src/login.ts`",
  "",
  "### Replace",
  "",
  "```diff",
  " export const form = {",
  "-  fields: [],",
  '+  fields: ["email"],',
  " };",
  "```",
  "",
  "## `docs/guide.md`",
  "",
  "### New file",
  "",
  "````md",
  "# Guide",
  "",
  "## Usage",
  "",
  "```sh",
  "bun run login",
  "```",
  "````",
].join("\n");

type SessionTexts = Readonly<Record<string, string>>;

const VALID: SessionTexts = { "PLAN.md": PLAN, "SCRATCH-TESTS.md": TESTS, "SCRATCH-CODE.md": CODE };

function check(texts: SessionTexts): readonly FormatProblem[] {
  return checkSessionFormat((name) => texts[name]);
}

function problem(file: string, message: string): unknown {
  return expect.objectContaining({ file, message: expect.stringContaining(message) });
}

describe("checkSessionFormat", () => {
  test("accepts a session that follows the formats, with headings inside nested fences", () => {
    expect(check(VALID)).toEqual([]);
  });

  test("reports a missing PLAN.md and SCRATCH-CODE.md", () => {
    expect(check({})).toEqual([
      { file: "PLAN.md", line: 1, message: "file is missing" },
      { file: "SCRATCH-CODE.md", line: 1, message: "file is missing" },
    ]);
  });

  test("reports a scratch file wrapped in a code fence", () => {
    const wrapped = `\`\`\`\`\`md\n${CODE}\n\`\`\`\`\`\n`;
    expect(check({ ...VALID, "SCRATCH-CODE.md": wrapped })).toContainEqual({
      file: "SCRATCH-CODE.md",
      line: 1,
      message: "first line must be '# Proposed changes'",
    });
  });

  test("rejects an operation heading with line numbers", () => {
    const code = CODE.replace("### Replace", "### Replace L42 to L57");
    expect(check({ ...VALID, "SCRATCH-CODE.md": code })).toEqual([
      { file: "SCRATCH-CODE.md", line: 5, message: expect.stringContaining("unknown operation 'Replace L42 to L57'") },
    ]);
  });

  test("rejects a path heading with text after the path", () => {
    const code = CODE.replace("## `src/login.ts`", "## `src/login.ts` (Task 2)");
    expect(check({ ...VALID, "SCRATCH-CODE.md": code })).toContainEqual(
      problem("SCRATCH-CODE.md", "must be a backticked path or 'Files to delete'"),
    );
  });

  test("rejects a deleted file listed with anything after its path", () => {
    const plan = PLAN.replace("| `src/login.test.ts` |", "| `src/login.test.ts`, `src/old.ts` |");
    const code = `${CODE}\n\n## Files to delete\n\n- \`src/old.ts\`, entire file, L1 to L88\n`;
    expect(check({ ...VALID, "PLAN.md": plan, "SCRATCH-CODE.md": code })).toContainEqual(
      problem("SCRATCH-CODE.md", "list a deleted file as '- `path`'"),
    );
  });

  test("reports a Scope path with no scratch section, and a section outside Scope", () => {
    const plan = PLAN.replace("| `src/login.test.ts` |", "| `src/login.test.ts`, `src/extra.ts` |");
    const code = `${CODE}\n\n## \`src/stray.ts\`\n\n### Delete\n\n\`\`\`diff\n-gone\n\`\`\`\n`;
    expect(check({ ...VALID, "PLAN.md": plan, "SCRATCH-CODE.md": code })).toEqual([
      { file: "PLAN.md", line: 13, message: "`src/extra.ts` is in Scope but has no section in the scratch files" },
      { file: "SCRATCH-CODE.md", line: 28, message: "`src/stray.ts` is not in the plan's Scope" },
    ]);
  });

  test("reports a task missing its status, goal, scope, or checks", () => {
    const plan = "# Add login\n\n## Task 1: Add the login form\n";
    const messages = check({ ...VALID, "PLAN.md": plan }).map((found) => found.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        "task has no '- Status:' line",
        "task has no '- Goal:' line",
        "task has no 'Scope:' line",
        "task has no 'Checks:' line",
      ]),
    );
  });

  test("rejects an unknown task status", () => {
    const plan = PLAN.replace("- Status: not started", "- Status: wip");
    expect(check({ ...VALID, "PLAN.md": plan })).toEqual([
      { file: "PLAN.md", line: 5, message: "unknown status 'wip'; use not started, in progress, done, or blocked" },
    ]);
  });

  test("rejects a plan heading that is not a task or the handoff", () => {
    const plan = `${PLAN}\n\n## Notes\n`;
    expect(check({ ...VALID, "PLAN.md": plan })).toContainEqual(
      problem("PLAN.md", "'## Notes' must be '## Task N: <verb phrase>' or '## Handoff'"),
    );
  });
});
`````
