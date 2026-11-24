import { describe, expect, test } from "bun:test";
import { checkPlanFormat, type FormatProblem } from "./format-check.ts";

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
  "",
  "Notes:",
  "",
  "````md",
  "## Not a heading",
  "",
  "```sh",
  "bun run login",
  "```",
  "````",
  "",
  "Checks:",
  "",
  "- `bun test` passes.",
].join("\n");

/** Matches any problem whose message contains `message`, at any line. */
function problem(message: string): FormatProblem {
  return expect.objectContaining({ file: "PLAN.md", message: expect.stringContaining(message) });
}

describe("checkPlanFormat", () => {
  test("accepts a plan that follows the format, with headings inside nested fences", () => {
    expect(checkPlanFormat(VALID_PLAN)).toEqual([]);
  });

  test("reports a missing PLAN.md", () => {
    expect(checkPlanFormat(undefined)).toEqual([{ file: "PLAN.md", line: 1, message: "file is missing" }]);
  });

  test("reports a plan wrapped in a code fence", () => {
    expect(checkPlanFormat(`\`\`\`\`\`md\n${VALID_PLAN}\n\`\`\`\`\`\n`)).toContainEqual(problem("first line must be '# <Title>'"));
  });

  test("reports a task missing its status, goal, scope, or checks", () => {
    const messages = checkPlanFormat("# Add login\n\n## Task 1: Add the login form\n").map((found) => found.message);
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
    expect(checkPlanFormat(VALID_PLAN.replace("- Status: not started", "- Status: wip"))).toEqual([
      { file: "PLAN.md", line: 5, message: "unknown status 'wip'; use not started, in progress, done, or blocked" },
    ]);
  });

  test("rejects a plan heading that is not a task or the handoff", () => {
    expect(checkPlanFormat(`${VALID_PLAN}\n\n## Notes\n`)).toContainEqual(
      problem("'## Notes' must be '## Task N: <verb phrase>' or '## Handoff'"),
    );
  });

  test("accepts CRLF line endings", () => {
    expect(checkPlanFormat(VALID_PLAN.replaceAll("\n", "\r\n"))).toEqual([]);
  });

  test("reports a plan with a handoff but no task", () => {
    expect(checkPlanFormat("# Add login\n\n## Handoff\n\n- Next: start the form.\n")).toContainEqual(
      problem("plan has no '## Task N: <verb phrase>' section"),
    );
  });
});
