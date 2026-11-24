import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { DIFIT, type DifitServer } from "./difit.ts";
import { checkPlanFormat } from "./format-check.ts";
import { installCommands } from "./install.ts";
import { cell, fields, paint, relativeAge, STATUS_STYLE, table } from "./report.ts";
import {
  overlappingSessionIds,
  parseScopePath,
  parseSessionId,
  parseStatus,
  parseTool,
  STATUSES,
  type Outcome,
  type Parsed,
  type Session,
} from "./session.ts";
import { SessionStore } from "./session-store.ts";
import {
  addWorktree,
  carryUncommitted,
  currentBranch,
  deleteBranch,
  discardBranch,
  discardWorktree,
  isMerged,
  landFiles,
  mainCheckout,
  pruneWorktrees,
  removeWorktree,
  sameCommit,
  siblingWorktreePath,
  trackedFiles,
} from "./worktree.ts";

export type Context = {
  readonly hubRoot: string;
  readonly color: boolean;
  readonly now: () => Date;
  readonly stdout: (text: string) => void;
  readonly stderr: (text: string) => void;
  /** Starts difit in `directory` with `args`, in the background. */
  readonly startDifit: (directory: string, args: readonly string[]) => Parsed<DifitServer>;
  /** Stops the difit server running as `pid`. */
  readonly stopDifit: (pid: number) => Outcome;
  /** Opens `url` in Google Chrome, in front of other windows. */
  readonly openInChrome: (url: string) => Outcome;
  /** Runs a dependency install `command` in `directory`. */
  readonly runInstall: (directory: string, command: readonly string[]) => Outcome;
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
branch named after the session, and a session folder in the hub for its plan
and state. The worktree holds the session's draft.

When the session starts from the current branch, the repository's uncommitted
changes and untracked files are copied into the new worktree, uncommitted.
Ignored files are not copied.

For each lockfile Git tracks, start runs the frozen install in its folder:
bun.lock and bun.lockb, package-lock.json, pnpm-lock.yaml, and yarn.lock. A
failed install prints a warning and the session still starts.

Options:
  --repo <path>   Project repository, or any folder inside it
  --tool <name>   Agent running the session: claude or codex
  --base <ref>    Branch or commit to start from (default: the current branch)
  --json          Print the new session as JSON

Example:
  sessions start add-login --repo ~/Projects/app --tool claude
`;

const CHECK_FORMAT_HELP = `Usage: sessions check-format <id>

Check a session's PLAN.md against the PLAN format in agents-coding-workflow:
the title, the task headings, and each task's fields.

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
per path, relative to the repository root. Status building fails while another
session in the same repository is building an overlapping scope.

Statuses:
  ${STATUSES.filter((status) => status !== "done").join(", ")}

Options:
  --status <status>  New status
  --scope <path>     Path the session changes; repeatable
  --json             Print the updated session as JSON

Example:
  sessions update add-login --status building --scope src/auth --scope README.md
`;

const FINISH_HELP = `Usage: sessions finish <id> [--discard-draft]

Remove the worktree and branch of a session whose branch is merged into its
base, then stop the session's difit server and move the session folder to the
archive. A worktree with uncommitted changes or an unmerged branch is left
untouched.

Options:
  --discard-draft  Remove the worktree and branch even when the draft is
                   uncommitted or unmerged. Pass it once the approved change is
                   built in the main checkout.
`;

const LAND_HELP = `Usage: sessions land <id> <path>...

Copy files from the session worktree into the main checkout, so the approved
draft lands one unit at a time. A file the draft deleted, one that existed
where the draft branched off, is deleted in main. Paths are files relative to
the repository root; nothing lands when one is a folder or not in the draft.

Example:
  sessions land add-login src/login.test.ts
`;

const DIFIT_HELP = `Usage: sessions difit <id>

Open the session's draft in difit, a diff viewer, in Google Chrome. It shows
every committed, uncommitted, and untracked change in the worktree against the
session base. The server keeps running in the background until the next
'sessions difit' or 'sessions finish' for the session; print the review
comments with:

  bunx ${DIFIT} comment get --port <port> --format json
`;

const COMMANDS: readonly Command[] = [
  { name: "start", summary: "Create a worktree and a session folder", help: START_HELP, run: start },
  { name: "list", summary: "Show active sessions, stale worktrees, and overlapping scopes", help: LIST_HELP, run: list },
  { name: "show", summary: "Show one session", help: SHOW_HELP, run: show },
  { name: "update", summary: "Change a session's status or scope", help: UPDATE_HELP, run: update },
  { name: "difit", summary: "Review the session's draft in difit", help: DIFIT_HELP, run: difit },
  { name: "land", summary: "Copy draft paths from the worktree into the main checkout", help: LAND_HELP, run: land },
  { name: "finish", summary: "Remove a merged session's worktree and branch, then archive it", help: FINISH_HELP, run: finish },
  { name: "check-format", summary: "Check a session's PLAN.md against its format", help: CHECK_FORMAT_HELP, run: checkFormat },
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
  const installs = installCommands(expectCommand(trackedFiles(session.worktree)));
  for (const install of installs) {
    const installed = context.runInstall(join(session.worktree, install.directory), install.command);
    if (!installed.ok) {
      warn(context, `'${install.command.join(" ")}' failed in ${install.directory}: ${installed.error}`);
    }
  }
  const installedDirectories = installs.map((install) => install.directory);
  const created = view(session, [session], store);
  if (values.json === true) {
    context.stdout(json({ ...created, carried, installed: installedDirectories }));
    return;
  }
  let carriedRows: readonly (readonly [string, string])[] = [];
  let carriedNote = "";
  if (carried.length > 0) {
    carriedRows = [["carried", `${carried.length} uncommitted file(s) from ${base}`]];
    carriedNote =
      `\nCarried, uncommitted in the worktree:\n${carried.map((path) => `  ${path}\n`).join("")}` +
      "difit shows them with the draft.\n";
  }
  const installedRows: readonly (readonly [string, string])[] =
    installedDirectories.length === 0 ? [] : [["installed", installedDirectories.join(", ")]];
  context.stdout(
    `Started ${paint(context.color, "bold", id)}\n` +
      fields(context.color, [
        ["worktree", created.worktree],
        ["branch", `${created.branch} from ${created.base}`],
        ["folder", created.folder],
        ...carriedRows,
        ...installedRows,
      ]) +
      carriedNote +
      "\nWrite PLAN.md in the folder and draft the change in the worktree.\n",
  );
}

function list(args: readonly string[], context: Context): void {
  const { values } = parseUsage(() =>
    parseArgs({ args: [...args], allowPositionals: false, strict: true, options: { json: { type: "boolean" } } }),
  );
  const store = new SessionStore(context.hubRoot);
  const { sessions, problems } = store.loadActive();
  for (const problem of problems) {
    warn(context, `skipped ${problem}`);
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
  const active = store.loadActive().sessions;
  if (updated.status === "building") {
    if (updated.scope.length === 0) {
      throw new CommandError("a session needs a scope before it builds", "pass --scope <path> once per path it changes");
    }
    const building = active.filter((other) => other.status === "building");
    const clashes = overlappingSessionIds(updated, building);
    if (clashes.length > 0) {
      throw new CommandError(
        `${clashes.join(", ")} is already building an overlapping scope in ${basename(session.repo)}`,
        "wait until it moves on from building, or narrow this session's --scope",
      );
    }
  }
  store.save(updated);
  if (values.json === true) {
    context.stdout(json(view(updated, active, store)));
    return;
  }
  const changes = [
    ...(status === undefined ? [] : [`status ${paint(context.color, STATUS_STYLE[status], status)}`]),
    ...(scope === undefined ? [] : [`scope ${scope.join(", ")}`]),
  ];
  context.stdout(`Updated ${paint(context.color, "bold", id)}: ${changes.join("; ")}\n`);
}

function difit(args: readonly string[], context: Context): void {
  const { positionals } = parseUsage(() =>
    parseArgs({ args: [...args], allowPositionals: true, strict: true, options: {} }),
  );
  const id = expectUsage(parseSessionId(onlyPositional(positionals, "<id>")));
  const store = new SessionStore(context.hubRoot);
  const session = expectCommand(store.load(id), LIST_HINT);
  if (!existsSync(session.worktree)) {
    throw new CommandError(`the worktree ${session.worktree} is missing`, `run 'sessions show ${id}'`);
  }
  stopSessionDifit(store, id, context);
  const server = expectCommand(
    context.startDifit(session.worktree, [".", session.base, "--merge-base", "--include-untracked", "--background", "--no-open"]),
    `run 'bunx ${DIFIT} . ${session.base}' in ${session.worktree} to see the full error`,
  );
  store.saveDifit(id, server);
  const url = `${server.url}/?session=${id}`;
  const opened = context.openInChrome(url);
  if (!opened.ok) {
    warn(context, `could not open Chrome: ${opened.error}`);
  }
  context.stdout(
    `Reviewing ${paint(context.color, "bold", id)} in difit\n` +
      fields(context.color, [
        ["url", url],
        ["port", String(server.port)],
        ["diff", `${session.worktree} against ${session.base}`],
      ]) +
      `\nRead the comments with: bunx ${DIFIT} comment get --port ${server.port} --format json\n`,
  );
}

function land(args: readonly string[], context: Context): void {
  const { positionals } = parseUsage(() =>
    parseArgs({ args: [...args], allowPositionals: true, strict: true, options: {} }),
  );
  const [rawId, ...rawPaths] = positionals;
  if (rawId === undefined) throw new UsageError("missing <id>");
  if (rawPaths.length === 0) throw new UsageError("missing <path>");
  const id = expectUsage(parseSessionId(rawId));
  const paths = rawPaths.map((path) => expectUsage(parseScopePath(path)));
  const session = expectCommand(new SessionStore(context.hubRoot).load(id), LIST_HINT);
  if (!existsSync(session.worktree)) {
    throw new CommandError(`the worktree ${session.worktree} is missing`, `run 'sessions show ${id}'`);
  }
  const landings = expectCommand(
    landFiles(session.worktree, session.repo, session.base, paths),
    "pass files relative to the repository root",
  );
  context.stdout(
    `Landed ${paint(context.color, "bold", id)} in ${session.repo}\n` +
      fields(context.color, landings.map((landing) => [landing.action, landing.path] as const)),
  );
}

function finish(args: readonly string[], context: Context): void {
  const { values, positionals } = parseUsage(() =>
    parseArgs({
      args: [...args],
      allowPositionals: true,
      strict: true,
      options: { "discard-draft": { type: "boolean" } },
    }),
  );
  const id = expectUsage(parseSessionId(onlyPositional(positionals, "<id>")));
  const discard = values["discard-draft"] === true;
  const store = new SessionStore(context.hubRoot);
  const session = expectCommand(store.load(id), LIST_HINT);
  if (!discard && !isMerged(session.repo, session.branch, session.base)) {
    throw new CommandError(
      `branch '${session.branch}' is not merged into '${session.base}'`,
      "merge it first, or pass --discard-draft once the approved change is built in the main checkout",
    );
  }
  const stopped = stopSessionDifit(store, id, context);
  const remove = discard ? discardWorktree : removeWorktree;
  const cleanup = existsSync(session.worktree) ? remove(session.repo, session.worktree) : pruneWorktrees(session.repo);
  if (!cleanup.ok) {
    throw new CommandError(
      `could not remove the worktree: ${cleanup.error}`,
      "commit or discard the changes in the worktree, then run finish again",
    );
  }
  const deleted = (discard ? discardBranch : deleteBranch)(session.repo, session.branch);
  if (!deleted.ok) {
    throw new CommandError(`could not delete branch '${session.branch}': ${deleted.error}`);
  }
  const archive = store.archive({ ...session, status: "done", updated: context.now().toISOString() });
  context.stdout(
    `Finished ${paint(context.color, "bold", id)}\n` +
      fields(context.color, [
        ["worktree", `removed ${session.worktree}`],
        ["branch", `deleted ${session.branch}`],
        ...(stopped === undefined ? [] : [["difit", `stopped the server on port ${stopped.port}`] as const]),
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
  const plan = join(folder, "PLAN.md");
  const problems = checkPlanFormat(existsSync(plan) ? readFileSync(plan, "utf8") : undefined);
  if (problems.length === 0) {
    context.stdout(`${id}: PLAN.md follows the format\n`);
    return;
  }
  throw new CommandError(
    `${problems.length} format problem(s) in ${folder}\n` +
      problems.map((problem) => `  ${problem.file}:${problem.line}: ${problem.message}`).join("\n"),
    "see references/PLAN-FORMAT.md in agents-coding-workflow",
  );
}

/** Stops the session's recorded difit server and forgets it. Returns the server, or undefined when none was recorded. */
function stopSessionDifit(store: SessionStore, id: string, context: Context): DifitServer | undefined {
  const server = store.loadDifit(id);
  if (server === undefined) return undefined;
  const stopped = context.stopDifit(server.pid);
  if (!stopped.ok) warn(context, `could not stop difit on port ${server.port}: ${stopped.error}`);
  store.forgetDifit(id);
  return server;
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

Each session gets a Git worktree beside its project repository for its draft,
and a folder in the hub for its plan and state.

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

function warn(context: Context, message: string): void {
  context.stderr(`${paint(context.color, "yellow", "warning")}: ${message}\n`);
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
