/** A rule of PLAN-FORMAT.md or SCRATCH-FORMAT.md that a session file breaks. */
export type FormatProblem = { readonly file: string; readonly line: number; readonly message: string };

const PLAN = "PLAN.md";
const TESTS = "SCRATCH-TESTS.md";
const CODE = "SCRATCH-CODE.md";
const FILES_TO_DELETE = "Files to delete";
const HANDOFF = "Handoff";
const STATUS_LABEL = "- Status:";
const TASK_STATUSES: readonly string[] = ["not started", "in progress", "done", "blocked"];
const PATH_PLACEHOLDER = "<path>";
const OPERATIONS: readonly string[] = [
  "Insert",
  "Replace",
  "Delete",
  "New file",
  `Rename from ${PATH_PLACEHOLDER}`,
  `New symlink to ${PATH_PLACEHOLDER}`,
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
    paths.push(...scopePaths(body));
  });
  if (taskCount === 0) report(1, "plan has no '## Task N: <verb phrase>' section");
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
  const sectionLines = new Map<string, number>();
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
        const earlier = sectionLines.get(path);
        if (earlier === undefined) sectionLines.set(path, line.number);
        else report(line.number, `\`${path}\` already has a section at line ${earlier}`);
        paths.push({ file, line: line.number, path });
        section = "path";
      }
    } else if (heading?.level === 3) {
      if (section !== "path") report(line.number, `'### ${heading.title}' must sit under a '## \`path\`' section`);
      else if (!isOperation(heading.title)) {
        report(line.number, `unknown operation '${heading.title}'; use ${listed(OPERATIONS)}`);
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

/** Whether `title` is one of OPERATIONS, with a non-empty path in place of the placeholder. */
function isOperation(title: string): boolean {
  return OPERATIONS.some((operation) => {
    const prefix = operation.replace(PATH_PLACEHOLDER, "");
    return prefix === operation ? title === operation : title.startsWith(prefix) && title.length > prefix.length;
  });
}

/** "a, b, or c". */
function listed(choices: readonly string[]): string {
  return choices.length < 2 ? choices.join("") : `${choices.slice(0, -1).join(", ")}, or ${choices.at(-1) ?? ""}`;
}

function backtickedPath(title: string): string | undefined {
  return /^`([^`]+)`$/.exec(title)?.[1];
}
