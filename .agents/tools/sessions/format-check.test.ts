import { describe, expect, test } from "bun:test";
import { checkSessionFormat, type FormatProblem } from "./format-check.ts";

const VALID_PLAN = [
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

const VALID_TESTS = [
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

const VALID_CODE = [
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

const VALID: SessionTexts = { "PLAN.md": VALID_PLAN, "SCRATCH-TESTS.md": VALID_TESTS, "SCRATCH-CODE.md": VALID_CODE };

function check(texts: SessionTexts): readonly FormatProblem[] {
  return checkSessionFormat((name) => texts[name]);
}

/** Matches any problem in `file` whose message contains `message`, at any line. */
function problem(file: string, message: string): FormatProblem {
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
    const wrapped = `\`\`\`\`\`md\n${VALID_CODE}\n\`\`\`\`\`\n`;
    expect(check({ ...VALID, "SCRATCH-CODE.md": wrapped })).toContainEqual({
      file: "SCRATCH-CODE.md",
      line: 1,
      message: "first line must be '# Proposed changes'",
    });
  });

  test("rejects an operation heading with line numbers", () => {
    const code = VALID_CODE.replace("### Replace", "### Replace L42 to L57");
    expect(check({ ...VALID, "SCRATCH-CODE.md": code })).toEqual([
      { file: "SCRATCH-CODE.md", line: 5, message: expect.stringContaining("unknown operation 'Replace L42 to L57'") },
    ]);
  });

  test("rejects a path heading with text after the path", () => {
    const code = VALID_CODE.replace("## `src/login.ts`", "## `src/login.ts` (Task 2)");
    expect(check({ ...VALID, "SCRATCH-CODE.md": code })).toContainEqual(
      problem("SCRATCH-CODE.md", "must be a backticked path or 'Files to delete'"),
    );
  });

  test("rejects a deleted file listed with anything after its path", () => {
    const plan = VALID_PLAN.replace("| `src/login.test.ts` |", "| `src/login.test.ts`, `src/old.ts` |");
    const code = `${VALID_CODE}\n\n## Files to delete\n\n- \`src/old.ts\`, entire file, L1 to L88\n`;
    expect(check({ ...VALID, "PLAN.md": plan, "SCRATCH-CODE.md": code })).toContainEqual(
      problem("SCRATCH-CODE.md", "list a deleted file as '- `path`'"),
    );
  });

  test("reports a Scope path with no scratch section, and a section outside Scope", () => {
    const plan = VALID_PLAN.replace("| `src/login.test.ts` |", "| `src/login.test.ts`, `src/extra.ts` |");
    const code = `${VALID_CODE}\n\n## \`src/stray.ts\`\n\n### Delete\n\n\`\`\`diff\n-gone\n\`\`\`\n`;
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
    const plan = VALID_PLAN.replace("- Status: not started", "- Status: wip");
    expect(check({ ...VALID, "PLAN.md": plan })).toEqual([
      { file: "PLAN.md", line: 5, message: "unknown status 'wip'; use not started, in progress, done, or blocked" },
    ]);
  });

  test("rejects a plan heading that is not a task or the handoff", () => {
    const plan = `${VALID_PLAN}\n\n## Notes\n`;
    expect(check({ ...VALID, "PLAN.md": plan })).toContainEqual(
      problem("PLAN.md", "'## Notes' must be '## Task N: <verb phrase>' or '## Handoff'"),
    );
  });

  test("accepts files with CRLF line endings", () => {
    const crlf = (text: string): string => text.replaceAll("\n", "\r\n");
    expect(
      check({ "PLAN.md": crlf(VALID_PLAN), "SCRATCH-TESTS.md": crlf(VALID_TESTS), "SCRATCH-CODE.md": crlf(VALID_CODE) }),
    ).toEqual([]);
  });

  test("reports a plan with a handoff but no task", () => {
    const plan = "# Add login\n\n## Handoff\n\n- Next: start the form.\n";
    expect(check({ ...VALID, "PLAN.md": plan })).toContainEqual(
      problem("PLAN.md", "plan has no '## Task N: <verb phrase>' section"),
    );
  });

  test("reports a path with more than one section", () => {
    const code = `${VALID_CODE}\n\n## \`src/login.ts\`\n\n### Delete\n\n\`\`\`diff\n-gone\n\`\`\`\n`;
    expect(check({ ...VALID, "SCRATCH-CODE.md": code })).toEqual([
      { file: "SCRATCH-CODE.md", line: 28, message: "`src/login.ts` already has a section at line 3" },
    ]);
  });

  test("accepts a rename from a path with spaces", () => {
    const code = VALID_CODE.replace("### New file", "### Rename from docs/old guide.md");
    expect(check({ ...VALID, "SCRATCH-CODE.md": code })).toEqual([]);
  });
});
