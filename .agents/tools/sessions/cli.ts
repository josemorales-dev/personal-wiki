import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { checkSessionFormat } from "./format-check.ts";
import { cell, fields, paint, relativeAge, STATUS_STYLE, table } from "./report.ts";
import {
  overlappingSessionIds,
  parseScopePath,
  parseSessionId,
  parseStatus,
  parseTool,
  STATUSES,
  type Parsed,
  type Session,
} from "./session.ts";
import { SessionStore } from "./session-store.ts";
import {
  addWorktree,
  carryUncommitted,
  currentBranch,
  deleteBranch,
  isMerged,
  mainCheckout,
  pruneWorktrees,
  removeWorktree,
  sameCommit,
  siblingWorktreePath,
} from "./worktree.ts";

export type Context = {
  readonly hubRoot: string;
  readonly color: boolean;
  readonly now: () => Date;
  readonly stdout: (text: string) => void;
  readonly stderr: (text: string) => void;
};

const EXIT_OK = 0;
const EXIT_FAILURE = 1;
const EXIT_USAGE = 2;

class UsageError extends Error {}

class CommandError extends Error {
  readonly hint: string | undefined;

  constructor(message: string, hint?: string) {
    super(message);
    this.hint = hint;
  }
}

type Command = {
  readonly name: string;
  readonly summary: string;
  readonly help: string;
  readonly run: (args: readonly string[], context: Context) => void;
};

type SessionView = Session & {
  readonly folder: string;
  readonly stale: boolean;
  readonly overlaps: readonly string[];
};

const LIST_HINT = "run 'sessions list' to see active sessions";

const START_HELP = `Usage: sessions start <id> --repo <path> --tool <claude|codex> [--base <ref>] [--json]

Create a worktree for the session beside its project repository, on a new
branch named after the session, and a session folder in the hub for its plan,
scratch files, and state.

When the session starts from the current branch, the repository's uncommitted
changes and untracked files are copied into the new worktree, uncommitted.
Ignored files are not copied.

Options:
  --repo <path>   Project repository, or any folder inside it
  --tool <name>   Agent running the session: claude or codex
  --base <ref>    Branch or commit to start from (default: the current branch)
  --json          Print the new session as JSON

Example:
  sessions start add-login --repo ~/Projects/app --tool claude
`;

const CHECK_FORMAT_HELP = `Usage: sessions check-format <id>

Check a session's PLAN.md and scratch files against the PLAN and scratch
formats in agents-coding-workflow: titles, headings, operation names, task
fields, and that every path in the plan's Scope has a scratch section.

Example:
  sessions check-format add-login
`;

const LIST_HELP = `Usage: sessions list [--json]

Show every active session, sorted by id, with notes for stale worktrees and
for sessions in the same repository whose scopes share a path.

Options:
  --json  Print the sessions as a JSON array
`;

const SHOW_HELP = `Usage: sessions show <id> [--json]

Show one session: its worktree, branch, session folder, scope, and notes.

Options:
  --json  Print the session as JSON
`;

const UPDATE_HELP = `Usage: sessions update <id> [--status <status>] [--scope <path>]... [--json]

Record a session's progress. --scope replaces the whole scope; repeat it once
per path, relative to the repository root.

Statuses:
  ${STATUSES.filter((status) => status !== "done").join(", ")}

Options:
  --status <status>  New status
  --scope <path>     Path the session changes; repeatable
  --json             Print the updated session as JSON

Example:
  sessions update add-login --status building --scope src/auth --scope README.md
`;

const FINISH_HELP = `Usage: sessions finish <id>

Remove the worktree and branch of a session whose branch is merged into its
base, then move the session folder to the archive. A worktree with uncommitted
changes or an unmerged branch is left untouched.
`;

const COMMANDS: readonly Command[] = [
  { name: "start", summary: "Create a worktree and a session folder", help: START_HELP, run: start },
  { name: "list", summary: "Show active sessions, stale worktrees, and overlapping scopes", help: LIST_HELP, run: list },
  { name: "show", summary: "Show one session", help: SHOW_HELP, run: show },
  { name: "update", summary: "Change a session's status or scope", help: UPDATE_HELP, run: update },
  { name: "finish", summary: "Remove a merged session's worktree and branch, then archive it", help: FINISH_HELP, run: finish },
  { name: "check-format", summary: "Check a session's PLAN.md and scratch files against their formats", help: CHECK_FORMAT_HELP, run: checkFormat },
];

export function run(argv: readonly string[], context: Context): number {
  const [name, ...args] = argv;
  try {
    if (name === undefined || name === "help" || name === "-h" || name === "--help") {
      context.stdout(args[0] === undefined ? mainHelp() : findCommand(args[0]).help);
      return EXIT_OK;
    }
    const command = findCommand(name);
    if (args.includes("-h") || args.includes("--help")) {
      context.stdout(command.help);
      return EXIT_OK;
    }
    command.run(args, context);
    return EXIT_OK;
  } catch (error: unknown) {
    return reportError(error, name, context);
  }
}

function start(args: readonly string[], context: Context): void {
  const { values, positionals } = parseUsage(() =>
    parseArgs({
      args: [...args],
      allowPositionals: true,
      strict: true,
      options: {
        repo: { type: "string" },
        tool: { type: "string" },
        base: { type: "string" },
        json: { type: "boolean" },
      },
    }),
  );
  const id = expectUsage(parseSessionId(onlyPositional(positionals, "<id>")));
  const tool = expectUsage(parseTool(requiredOption(values.tool, "--tool <claude|codex>")));
  const repo = expectCommand(
    mainCheckout(resolve(requiredOption(values.repo, "--repo <path>"))),
    "pass the project repository with --repo <path>",
  );
  const base = values.base ?? expectCommand(currentBranch(repo), "pass the branch or commit to start from with --base <ref>");
  const store = new SessionStore(context.hubRoot);
  if (!store.claim(id)) {
    throw new CommandError(`session '${id}' already exists`, `pick another id, or run 'sessions show ${id}'`);
  }
  const timestamp = context.now().toISOString();
  const session: Session = {
    id,
    tool,
    repo,
    worktree: siblingWorktreePath(repo, id),
    branch: id,
    base,
    status: "aligning",
    scope: [],
    created: timestamp,
    updated: timestamp,
  };
  store.save(session);
  const added = addWorktree(repo, session.worktree, session.branch, base);
  if (!added.ok) {
    store.release(id);
    throw new CommandError(`could not create the worktree: ${added.error}`);
  }
  const carried = sameCommit(repo, base, "HEAD")
    ? expectCommand(
        carryUncommitted(repo, session.worktree),
        `the worktree exists without the uncommitted changes; copy them by hand or run 'sessions show ${id}'`,
      )
    : [];
  const created = view(session, [session], store);
  if (values.json === true) {
    context.stdout(json({ ...created, carried }));
    return;
  }
  let carriedRows: readonly (readonly [string, string])[] = [];
  let carriedNote = "";
  if (carried.length > 0) {
    carriedRows = [["carried", `${carried.length} uncommitted file(s) from ${base}`]];
    carriedNote =
      `\nCarried, uncommitted in the worktree:\n${carried.map((path) => `  ${path}\n`).join("")}` +
      `Stage only the session's own changes. Before merging, commit or stash the copy on ${base} of any file the session also changed.\n`;
  }
  context.stdout(
    `Started ${paint(context.color, "bold", id)}\n` +
      fields(context.color, [
        ["worktree", created.worktree],
        ["branch", `${created.branch} from ${created.base}`],
        ["folder", created.folder],
        ...carriedRows,
      ]) +
      carriedNote +
      "\nWrite PLAN.md in the folder and make every change in the worktree.\n",
  );
}

function list(args: readonly string[], context: Context): void {
  const { values } = parseUsage(() =>
    parseArgs({ args: [...args], allowPositionals: false, strict: true, options: { json: { type: "boolean" } } }),
  );
  const store = new SessionStore(context.hubRoot);
  const { sessions, problems } = store.loadActive();
  for (const problem of problems) {
    context.stderr(`${paint(context.color, "yellow", "warning")}: skipped ${problem}\n`);
  }
  const views = sessions.map((session) => view(session, sessions, store));
  if (values.json === true) {
    context.stdout(json(views));
    return;
  }
  if (views.length === 0) {
    context.stdout("No active sessions.\nStart one with: sessions start <id> --repo <path> --tool <claude|codex>\n");
    return;
  }
  const now = context.now();
  context.stdout(
    table(
      context.color,
      ["ID", "TOOL", "REPO", "STATUS", "UPDATED", "NOTES"],
      views.map((session) => [
        cell(session.id),
        cell(session.tool),
        cell(basename(session.repo)),
        cell(session.status, STATUS_STYLE[session.status]),
        cell(relativeAge(session.updated, now), "dim"),
        cell(notes(session), "red"),
      ]),
    ),
  );
}

function show(args: readonly string[], context: Context): void {
  const { values, positionals } = parseUsage(() =>
    parseArgs({ args: [...args], allowPositionals: true, strict: true, options: { json: { type: "boolean" } } }),
  );
  const id = expectUsage(parseSessionId(onlyPositional(positionals, "<id>")));
  const store = new SessionStore(context.hubRoot);
  const session = expectCommand(store.load(id), LIST_HINT);
  const shown = view(session, store.loadActive().sessions, store);
  if (values.json === true) {
    context.stdout(json(shown));
    return;
  }
  const { color } = context;
  const rows: (readonly [string, string])[] = [
    ["tool", shown.tool],
    ["repo", shown.repo],
    ["worktree", shown.stale ? `${shown.worktree} ${paint(color, "red", "(missing)")}` : shown.worktree],
    ["branch", `${shown.branch} from ${shown.base}`],
    ["folder", shown.folder],
    ["scope", shown.scope.length === 0 ? paint(color, "dim", "none yet") : shown.scope.join(", ")],
    ["updated", relativeAge(shown.updated, context.now())],
  ];
  if (shown.overlaps.length > 0) {
    rows.push(["overlaps", paint(color, "red", shown.overlaps.join(", "))]);
  }
  context.stdout(
    `${paint(color, "bold", shown.id)}  ${paint(color, STATUS_STYLE[shown.status], shown.status)}\n` + fields(color, rows),
  );
}

function update(args: readonly string[], context: Context): void {
  const { values, positionals } = parseUsage(() =>
    parseArgs({
      args: [...args],
      allowPositionals: true,
      strict: true,
      options: {
        status: { type: "string" },
        scope: { type: "string", multiple: true },
        json: { type: "boolean" },
      },
    }),
  );
  const id = expectUsage(parseSessionId(onlyPositional(positionals, "<id>")));
  if (values.status === undefined && values.scope === undefined) {
    throw new UsageError("nothing to update: pass --status <status> or --scope <path>");
  }
  const status = values.status === undefined ? undefined : expectUsage(parseStatus(values.status));
  if (status === "done") {
    throw new UsageError("status 'done' is set by 'sessions finish'");
  }
  const scope = values.scope?.map((path) => expectUsage(parseScopePath(path)));
  const store = new SessionStore(context.hubRoot);
  const session = expectCommand(store.load(id), LIST_HINT);
  const updated: Session = {
    ...session,
    status: status ?? session.status,
    scope: scope ?? session.scope,
    updated: context.now().toISOString(),
  };
  store.save(updated);
  if (values.json === true) {
    context.stdout(json(view(updated, store.loadActive().sessions, store)));
    return;
  }
  const changes = [
    ...(status === undefined ? [] : [`status ${paint(context.color, STATUS_STYLE[status], status)}`]),
    ...(scope === undefined ? [] : [`scope ${scope.join(", ")}`]),
  ];
  context.stdout(`Updated ${paint(context.color, "bold", id)}: ${changes.join("; ")}\n`);
}

function finish(args: readonly string[], context: Context): void {
  const { positionals } = parseUsage(() =>
    parseArgs({ args: [...args], allowPositionals: true, strict: true, options: {} }),
  );
  const id = expectUsage(parseSessionId(onlyPositional(positionals, "<id>")));
  const store = new SessionStore(context.hubRoot);
  const session = expectCommand(store.load(id), LIST_HINT);
  if (!isMerged(session.repo, session.branch, session.base)) {
    throw new CommandError(
      `branch '${session.branch}' is not merged into '${session.base}'`,
      `merge it first; to discard the work, remove the worktree and branch yourself`,
    );
  }
  const cleanup = existsSync(session.worktree)
    ? removeWorktree(session.repo, session.worktree)
    : pruneWorktrees(session.repo);
  if (!cleanup.ok) {
    throw new CommandError(
      `could not remove the worktree: ${cleanup.error}`,
      "commit or discard the changes in the worktree, then run finish again",
    );
  }
  const deleted = deleteBranch(session.repo, session.branch);
  if (!deleted.ok) {
    throw new CommandError(`could not delete branch '${session.branch}': ${deleted.error}`);
  }
  const archive = store.archive({ ...session, status: "done", updated: context.now().toISOString() });
  context.stdout(
    `Finished ${paint(context.color, "bold", id)}\n` +
      fields(context.color, [
        ["worktree", `removed ${session.worktree}`],
        ["branch", `deleted ${session.branch}`],
        ["archive", archive],
      ]),
  );
}

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

function view(session: Session, sessions: readonly Session[], store: SessionStore): SessionView {
  return {
    ...session,
    folder: store.folder(session.id),
    stale: !existsSync(session.worktree),
    overlaps: overlappingSessionIds(session, sessions),
  };
}

function notes(session: SessionView): string {
  const parts: string[] = [];
  if (session.stale) parts.push("stale: worktree missing");
  if (session.overlaps.length > 0) parts.push(`overlaps ${session.overlaps.join(", ")}`);
  return parts.join("; ");
}

function mainHelp(): string {
  const width = Math.max(...COMMANDS.map((command) => command.name.length));
  const commands = COMMANDS.map((command) => `  ${command.name.padEnd(width)}  ${command.summary}`).join("\n");
  return `sessions: track agent coding sessions across repositories

Each session gets a Git worktree beside its project repository and a folder in
the hub for its plan, scratch files, and state.

Usage:
  sessions <command> [options]

Commands:
${commands}

Run 'sessions help <command>' or 'sessions <command> --help' for details.
`;
}

function findCommand(name: string): Command {
  const command = COMMANDS.find((candidate) => candidate.name === name);
  if (command === undefined) throw new UsageError(`unknown command '${name}'`);
  return command;
}

function reportError(error: unknown, name: string | undefined, context: Context): number {
  const label = paint(context.color, "red", "error");
  if (error instanceof UsageError) {
    const known = COMMANDS.some((command) => command.name === name);
    const helpCommand = known && name !== undefined ? `sessions help ${name}` : "sessions help";
    context.stderr(`${label}: ${error.message}\nRun '${helpCommand}' for usage.\n`);
    return EXIT_USAGE;
  }
  if (error instanceof CommandError) {
    const hint = error.hint === undefined ? "" : `${paint(context.color, "cyan", "hint")}: ${error.hint}\n`;
    context.stderr(`${label}: ${error.message}\n${hint}`);
    return EXIT_FAILURE;
  }
  throw error;
}

/** Turns `parseArgs` errors, such as an unknown option, into usage errors. */
function parseUsage<T>(parse: () => T): T {
  try {
    return parse();
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && typeof error.code === "string" && error.code.startsWith("ERR_PARSE_ARGS")) {
      throw new UsageError(error.message);
    }
    throw error;
  }
}

function onlyPositional(positionals: readonly string[], name: string): string {
  const [first, ...extra] = positionals;
  if (first === undefined) throw new UsageError(`missing ${name}`);
  if (extra.length > 0) throw new UsageError(`unexpected argument '${extra.join(" ")}'`);
  return first;
}

function requiredOption(value: string | undefined, name: string): string {
  if (value === undefined) throw new UsageError(`missing ${name}`);
  return value;
}

function expectUsage<T>(parsed: Parsed<T>): T {
  if (!parsed.ok) throw new UsageError(parsed.error);
  return parsed.value;
}

function expectCommand<T>(parsed: Parsed<T>, hint?: string): T {
  if (!parsed.ok) throw new CommandError(parsed.error, hint);
  return parsed.value;
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
