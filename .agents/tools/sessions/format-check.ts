/** A rule of PLAN-FORMAT.md that a session's PLAN.md breaks. */
export type FormatProblem = { readonly file: string; readonly line: number; readonly message: string };

const PLAN = "PLAN.md";
const HANDOFF = "Handoff";
const STATUS_LABEL = "- Status:";
const TASK_STATUSES: readonly string[] = ["not started", "in progress", "done", "blocked"];

type Line = { readonly number: number; readonly text: string };
type Heading = { readonly level: number; readonly title: string };

/** Checks a session's PLAN.md against the mechanical rules of its format. `text` is undefined when the file is missing. */
export function checkPlanFormat(text: string | undefined): readonly FormatProblem[] {
  if (text === undefined) return [{ file: PLAN, line: 1, message: "file is missing" }];
  const lines = proseLines(text);
  const problems: FormatProblem[] = [];
  const report = (line: number, message: string): void => {
    problems.push({ file: PLAN, line, message });
  };
  const first = lines.find((line) => line.text.trim() !== "");
  if (first === undefined || !/^# \S/.test(first.text)) report(first?.number ?? 1, "first line must be '# <Title>'");
  const sectionStarts = lines.flatMap((line, index) => (headingOf(line)?.level === 2 ? [index] : []));
  let taskCount = 0;
  sectionStarts.forEach((start, position) => {
    const headingLine = lines[start];
    const heading = headingLine === undefined ? undefined : headingOf(headingLine);
    if (headingLine === undefined || heading === undefined || heading.title === HANDOFF) return;
    if (!/^Task \d+: \S/.test(heading.title)) {
      report(headingLine.number, `'## ${heading.title}' must be '## Task N: <verb phrase>' or '## ${HANDOFF}'`);
      return;
    }
    taskCount += 1;
    const body = lines.slice(start + 1, sectionStarts[position + 1] ?? lines.length);
    const status = body.find((line) => line.text.startsWith(STATUS_LABEL));
    if (status === undefined) report(headingLine.number, `task has no '${STATUS_LABEL}' line`);
    else {
      const value = status.text.slice(STATUS_LABEL.length).trim();
      if (!TASK_STATUSES.includes(value)) report(status.number, `unknown status '${value}'; use ${listed(TASK_STATUSES)}`);
    }
    if (!body.some((line) => /^- Goal: \S/.test(line.text))) report(headingLine.number, "task has no '- Goal:' line");
    for (const label of ["Scope:", "Checks:"]) {
      if (!body.some((line) => line.text === label)) report(headingLine.number, `task has no '${label}' line`);
    }
  });
  if (taskCount === 0) report(1, "plan has no '## Task N: <verb phrase>' section");
  return problems;
}

/**
 * The lines outside fenced code blocks, so code in the plan never reads as structure. A fence closes only on the same
 * character repeated at least as many times, which lets a longer fence hold a shorter one.
 */
function proseLines(text: string): readonly Line[] {
  const lines: Line[] = [];
  let fence: string | undefined;
  text.split(/\r?\n/).forEach((content, index) => {
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

/** "a, b, or c". */
function listed(choices: readonly string[]): string {
  return choices.length < 2 ? choices.join("") : `${choices.slice(0, -1).join(", ")}, or ${choices.at(-1) ?? ""}`;
}
