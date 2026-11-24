`````md
# Proposed changes

## `.agents/tools/sessions/package.json`

### New file

`bun add -d typescript @types/bun` adds `devDependencies` with the versions current at install time.

```json
{
  "name": "sessions",
  "private": true,
  "type": "module",
  "bin": {
    "sessions": "./main.ts"
  },
  "scripts": {
    "test": "bun test",
    "typecheck": "tsc --noEmit",
    "check": "tsc --noEmit && bun test"
  }
}
```

## `.agents/tools/sessions/tsconfig.json`

### New file

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["ESNext"],
    "module": "Preserve",
    "moduleResolution": "bundler",
    "types": ["bun"],
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["*.ts"]
}
```

## `.agents/tools/sessions/session.ts`

### New file

```ts
import { posix } from "node:path";

export const STATUSES = [
  "aligning",
  "awaiting-approval",
  "building",
  "reviewing",
  "blocked",
  "shipped",
  "done",
] as const;
export type Status = (typeof STATUSES)[number];

export const TOOLS = ["claude", "codex"] as const;
export type Tool = (typeof TOOLS)[number];

export type Session = {
  readonly id: string;
  readonly tool: Tool;
  readonly repo: string;
  readonly worktree: string;
  readonly branch: string;
  readonly base: string;
  readonly status: Status;
  readonly scope: readonly string[];
  readonly created: string;
  readonly updated: string;
};

export type Parsed<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: string };

const SESSION_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SESSION_ID_LENGTH = 64;

export function parseSessionId(raw: string): Parsed<string> {
  if (raw.length <= MAX_SESSION_ID_LENGTH && SESSION_ID.test(raw)) {
    return { ok: true, value: raw };
  }
  return {
    ok: false,
    error: `invalid session id '${raw}': use lowercase kebab-case, at most ${MAX_SESSION_ID_LENGTH} characters`,
  };
}

export function parseStatus(raw: string): Parsed<Status> {
  return parseChoice("status", STATUSES, raw);
}

export function parseTool(raw: string): Parsed<Tool> {
  return parseChoice("tool", TOOLS, raw);
}

/** A repository-relative path, normalized so `./src/auth/` and `src/auth` compare equal. */
export function parseScopePath(raw: string): Parsed<string> {
  const path = posix.normalize(raw).replace(/\/+$/, "");
  const outside = path === "" || path === "." || path === ".." || path.startsWith("../") || posix.isAbsolute(path);
  if (outside) {
    return { ok: false, error: `invalid scope path '${raw}': use a path relative to the repository root` };
  }
  return { ok: true, value: path };
}

/** Ids of the other sessions in the same repository whose scope shares a path with this one. */
export function overlappingSessionIds(session: Session, sessions: readonly Session[]): string[] {
  return sessions
    .filter((other) => other.id !== session.id && other.repo === session.repo)
    .filter((other) =>
      other.scope.some((path) => session.scope.some((own) => contains(own, path) || contains(path, own))),
    )
    .map((other) => other.id);
}

export function parseSession(input: unknown): Parsed<Session> {
  if (!isRecord(input)) {
    return { ok: false, error: "session file is not a JSON object" };
  }
  const record = input;
  const text = (key: string): string | undefined => {
    const value = record[key];
    return typeof value === "string" ? value : undefined;
  };
  const id = text("id");
  const tool = text("tool");
  const repo = text("repo");
  const worktree = text("worktree");
  const branch = text("branch");
  const base = text("base");
  const status = text("status");
  const created = text("created");
  const updated = text("updated");
  const scope = parseScope(record["scope"]);
  if (
    id === undefined ||
    tool === undefined ||
    repo === undefined ||
    worktree === undefined ||
    branch === undefined ||
    base === undefined ||
    status === undefined ||
    created === undefined ||
    updated === undefined ||
    scope === undefined
  ) {
    return { ok: false, error: "session file is missing a field or has a field of the wrong type" };
  }
  const parsedTool = parseTool(tool);
  if (!parsedTool.ok) return parsedTool;
  const parsedStatus = parseStatus(status);
  if (!parsedStatus.ok) return parsedStatus;
  return {
    ok: true,
    value: {
      id,
      tool: parsedTool.value,
      repo,
      worktree,
      branch,
      base,
      status: parsedStatus.value,
      scope,
      created,
      updated,
    },
  };
}

function parseChoice<T extends string>(name: string, choices: readonly T[], raw: string): Parsed<T> {
  const choice = choices.find((candidate) => candidate === raw);
  if (choice === undefined) {
    return { ok: false, error: `invalid ${name} '${raw}': expected one of ${choices.join(", ")}` };
  }
  return { ok: true, value: choice };
}

function parseScope(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items: readonly unknown[] = value;
  const paths = items.filter((item): item is string => typeof item === "string");
  return paths.length === items.length ? paths : undefined;
}

function contains(parent: string, path: string): boolean {
  return path === parent || path.startsWith(`${parent}/`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
```

## `.agents/tools/sessions/session-store.ts`

### New file

```ts
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parseSession, type Parsed, type Session } from "./session.ts";

const SESSION_FILE = "session.json";

export type ActiveSessions = {
  readonly sessions: readonly Session[];
  readonly problems: readonly string[];
};

/**
 * Session state in the hub. Each session owns one folder and writes only its
 * own file, so agents running in parallel never write the same file.
 */
export class SessionStore {
  readonly #activeRoot: string;
  readonly #archiveRoot: string;

  constructor(hubRoot: string) {
    this.#activeRoot = join(hubRoot, ".agents", "sessions");
    this.#archiveRoot = join(hubRoot, ".agents", "archive", "sessions");
  }

  folder(id: string): string {
    return join(this.#activeRoot, id);
  }

  /** Reserves the id by creating its folder. False when an active or archived session holds it. */
  claim(id: string): boolean {
    if (existsSync(join(this.#archiveRoot, id))) return false;
    mkdirSync(this.#activeRoot, { recursive: true });
    try {
      mkdirSync(this.folder(id));
      return true;
    } catch (error: unknown) {
      if (isAlreadyExists(error)) return false;
      throw error;
    }
  }

  release(id: string): void {
    rmSync(this.folder(id), { recursive: true, force: true });
  }

  /** Writes a temporary file and renames it, so readers never see a partial file. */
  save(session: Session): void {
    const file = join(this.folder(session.id), SESSION_FILE);
    const temporary = `${file}.${process.pid}.tmp`;
    writeFileSync(temporary, `${JSON.stringify(session, null, 2)}\n`);
    renameSync(temporary, file);
  }

  load(id: string): Parsed<Session> {
    const file = join(this.folder(id), SESSION_FILE);
    if (!existsSync(file)) {
      return { ok: false, error: `no active session '${id}'` };
    }
    try {
      const json: unknown = JSON.parse(readFileSync(file, "utf8"));
      return parseSession(json);
    } catch (error: unknown) {
      return { ok: false, error: `unreadable session file: ${errorMessage(error)}` };
    }
  }

  loadActive(): ActiveSessions {
    if (!existsSync(this.#activeRoot)) return { sessions: [], problems: [] };
    const sessions: Session[] = [];
    const problems: string[] = [];
    for (const entry of readdirSync(this.#activeRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const loaded = this.load(entry.name);
      if (loaded.ok) sessions.push(loaded.value);
      else problems.push(`${entry.name}: ${loaded.error}`);
    }
    sessions.sort((a, b) => a.id.localeCompare(b.id));
    return { sessions, problems };
  }

  /** Saves the final state and moves the folder to the archive. Returns the archive folder. */
  archive(session: Session): string {
    this.save(session);
    const destination = join(this.#archiveRoot, session.id);
    mkdirSync(dirname(destination), { recursive: true });
    renameSync(this.folder(session.id), destination);
    return destination;
  }
}

function isAlreadyExists(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "EEXIST";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
```

## `.agents/tools/sessions/worktree.ts`

### New file

```ts
import { basename, dirname, join } from "node:path";
import type { Parsed } from "./session.ts";

export type GitOutcome = { readonly ok: true } | { readonly ok: false; readonly error: string };

type GitResult = { readonly ok: true; readonly output: string } | { readonly ok: false; readonly error: string };

function git(directory: string, args: readonly string[]): GitResult {
  const result = Bun.spawnSync(["git", "-C", directory, ...args], { stdout: "pipe", stderr: "pipe" });
  if (result.exitCode === 0) return { ok: true, output: result.stdout.toString().trim() };
  return { ok: false, error: result.stderr.toString().trim() };
}

/** The main checkout of the repository holding `path`, even when `path` is inside a linked worktree. */
export function mainCheckout(path: string): Parsed<string> {
  const commonDirectory = git(path, ["rev-parse", "--path-format=absolute", "--git-common-dir"]);
  if (!commonDirectory.ok) return { ok: false, error: `not a Git repository: ${path}` };
  return { ok: true, value: dirname(commonDirectory.output) };
}

export function currentBranch(repo: string): Parsed<string> {
  const branch = git(repo, ["symbolic-ref", "--quiet", "--short", "HEAD"]);
  if (!branch.ok) return { ok: false, error: `${repo} is on a detached HEAD` };
  return { ok: true, value: branch.output };
}

/** `<parent>/<repo>.worktrees/<id>`: beside the repository, so editors and watchers in it never index other sessions. */
export function siblingWorktreePath(repo: string, id: string): string {
  return join(dirname(repo), `${basename(repo)}.worktrees`, id);
}

export function addWorktree(repo: string, path: string, branch: string, base: string): GitOutcome {
  return git(repo, ["worktree", "add", "-b", branch, path, base]);
}

export function isMerged(repo: string, branch: string, base: string): boolean {
  return git(repo, ["merge-base", "--is-ancestor", branch, base]).ok;
}

/** Refuses a worktree with uncommitted changes. */
export function removeWorktree(repo: string, path: string): GitOutcome {
  return git(repo, ["worktree", "remove", path]);
}

/** Forgets worktrees whose folders were deleted by hand. */
export function pruneWorktrees(repo: string): GitOutcome {
  return git(repo, ["worktree", "prune"]);
}

/** Refuses a branch that is not merged. */
export function deleteBranch(repo: string, branch: string): GitOutcome {
  return git(repo, ["branch", "-d", branch]);
}
```

## `.agents/tools/sessions/report.ts`

### New file

```ts
import type { Status } from "./session.ts";

const STYLES = { bold: "1", dim: "2", red: "31", green: "32", yellow: "33", cyan: "36" } as const;
export type Style = keyof typeof STYLES;

export const STATUS_STYLE: Readonly<Record<Status, Style>> = {
  aligning: "cyan",
  "awaiting-approval": "yellow",
  building: "cyan",
  reviewing: "cyan",
  blocked: "red",
  shipped: "green",
  done: "green",
};

export function paint(color: boolean, style: Style, text: string): string {
  return color ? `\u001b[${STYLES[style]}m${text}\u001b[0m` : text;
}

export type Cell = { readonly text: string; readonly style: Style | undefined };

export function cell(text: string, style?: Style): Cell {
  return { text, style };
}

/** Left-aligned columns under a bold header. The last column is not padded. */
export function table(color: boolean, header: readonly string[], rows: readonly (readonly Cell[])[]): string {
  const widths = header.map((title, column) =>
    Math.max(title.length, ...rows.map((row) => row[column]?.text.length ?? 0)),
  );
  const line = (cells: readonly Cell[]): string => {
    const columns = cells.map((current, column) => {
      const last = column === cells.length - 1;
      const text = last ? current.text : current.text.padEnd(widths[column] ?? 0);
      return current.style === undefined ? text : paint(color, current.style, text);
    });
    return `${columns.join("  ").trimEnd()}\n`;
  };
  return line(header.map((title) => cell(title, "bold"))) + rows.map(line).join("");
}

/** Two-column key and value lines, indented under a heading. */
export function fields(color: boolean, rows: readonly (readonly [string, string])[]): string {
  const width = Math.max(...rows.map(([key]) => key.length));
  return rows.map(([key, value]) => `  ${paint(color, "dim", key.padEnd(width))}  ${value}\n`).join("");
}

export function relativeAge(isoTime: string, now: Date): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - Date.parse(isoTime)) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
```

## `.agents/tools/sessions/cli.ts`

### New file

```ts
import { existsSync } from "node:fs";
import { basename, resolve } from "node:path";
import { parseArgs } from "node:util";
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
  currentBranch,
  deleteBranch,
  isMerged,
  mainCheckout,
  pruneWorktrees,
  removeWorktree,
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

Options:
  --repo <path>   Project repository, or any folder inside it
  --tool <name>   Agent running the session: claude or codex
  --base <ref>    Branch or commit to start from (default: the current branch)
  --json          Print the new session as JSON

Example:
  sessions start add-login --repo ~/Projects/app --tool claude
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
  const created = view(session, [session], store);
  if (values.json === true) {
    context.stdout(json(created));
    return;
  }
  context.stdout(
    `Started ${paint(context.color, "bold", id)}\n` +
      fields(context.color, [
        ["worktree", created.worktree],
        ["branch", `${created.branch} from ${created.base}`],
        ["folder", created.folder],
      ]) +
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
```

## `.agents/tools/sessions/main.ts`

### New file

```ts
#!/usr/bin/env bun
import { run } from "./cli.ts";
import { mainCheckout } from "./worktree.ts";

const hub = mainCheckout(import.meta.dir);
if (!hub.ok) {
  process.stderr.write("error: the sessions tool must live inside the hub repository\n");
  process.exit(1);
}

const color = process.stdout.isTTY && (process.env["NO_COLOR"] ?? "") === "" && process.env["TERM"] !== "dumb";

process.exitCode = run(process.argv.slice(2), {
  hubRoot: hub.value,
  color,
  now: () => new Date(),
  stdout: (text) => {
    process.stdout.write(text);
  },
  stderr: (text) => {
    process.stderr.write(text);
  },
});
```

## `.gitignore`

### Insert after L13

```diff
 # Codex project config (rules) lives in the repo; overrides the global ignore
 !.codex/
+
+# Live session state belongs to this machine; archived sessions are tracked.
+.agents/sessions/
+.agents/tools/sessions/node_modules/
```

## `AGENTS.md`

### Insert after L50

```diff
 Slash commands are user-typed: name the command and ask the user to run it.
+
+Sessions for every project live in this hub, each with a Git worktree beside its
+project repository. `agents-coding-workflow` manages them with the `sessions`
+tool.
```

## `.agents/skills/agents-coding-workflow/SKILL.md`

### Replace L35 to L41

```diff
-Use a session for every change except a small, clear one: `PLAN.md`, `SCRATCH-TESTS.md`, and `SCRATCH-CODE.md` under the selected project's `.agents/sessions/<session-id>/`, tracked in `.agents/CONTROLS.md`. Read the formats before writing them:
+Use a session for every change except a small, clear one. Sessions for every project live in the hub, so one list shows every agent's work on this machine. Manage them with `sessions`, which means `bun ~/Projects/personal-wiki/.agents/tools/sessions/main.ts`; `sessions help` lists its commands.
+
+- Check: run `sessions list` before starting. When another session's scope overlaps the new work, tell the user before building.
+- Start: run `sessions start <id> --repo <project> --tool <claude|codex>` before writing `PLAN.md`. It creates the worktree `<project>.worktrees/<id>` on branch `<id>` and the session folder `.agents/sessions/<id>/` in the hub. Write `PLAN.md`, the scratch files, and `RESEARCH.md` in the folder, and make every change and commit in the worktree.
+- Track: record each step with `sessions update <id> --status <status>`, and record the approved plan's `Scope` paths with `--scope`.
+- Finish: after the branch is merged, run `sessions finish <id>`. It removes the worktree and branch and archives the folder.
+
+Read the formats before writing them:
 
 - [references/PLAN-FORMAT.md](references/PLAN-FORMAT.md): session plans and handoff.
 - [references/SCRATCH-FORMAT.md](references/SCRATCH-FORMAT.md): the exact test and code changes, approved together with the plan.
-- [references/CONTROLS-FORMAT.md](references/CONTROLS-FORMAT.md): active session tracking.
 
-Resuming a session: its `PLAN.md`, scratch files, and Git history are the authoritative trail. Reconstruct state from them, continue from the handoff's `Next`, and re-run only the checks the remaining work touches.
+Resuming a session: `sessions show <id>` gives its worktree and folder. Its `PLAN.md`, scratch files, and Git history are the authoritative trail. Reconstruct state from them, continue from the handoff's `Next`, and re-run only the checks the remaining work touches.
```

### Replace L45

```diff
-Use existing project conventions for documentation, memory, issues, and ADRs. If adopting the `.agents/` convention, project context goes in `.agents/docs/PROJECT_CONTEXT.md`, supplemental memory in `.agents/MEMORY.md` and `.agents/memories/`, and archived sessions in `.agents/archive/sessions/`. Read only relevant current memory. Archive completed session state after retaining durable facts and removing its controls entry. An absent file does not require copying global or unrelated project state.
+Use existing project conventions for documentation, memory, issues, and ADRs. If adopting the `.agents/` convention, project context goes in `.agents/docs/PROJECT_CONTEXT.md` and supplemental memory in `.agents/MEMORY.md` and `.agents/memories/`. Read only relevant current memory. Before `sessions finish`, move durable facts from the session into project memory or docs. An absent file does not require copying global or unrelated project state.
```

## `.agents/skills/PATHS.md`

### Replace L9

```diff
-Paths such as `.agents/CONTROLS.md`, `.agents/issues/`, `.agents/docs/`, `src/`, `tests/`, and `docs/adr/` refer to the selected project, never to the hub's skill collection unless the hub itself is the selected project. Keep project memory, issues, session state, and context in that project. Create missing working-state files only when the task needs them; an absent project guide is not permission to substitute another project's guide.
+Paths such as `.agents/issues/`, `.agents/docs/`, `src/`, `tests/`, and `docs/adr/` refer to the selected project, never to the hub's skill collection unless the hub itself is the selected project. Keep project memory, issues, and context in that project. Session state is the exception: it lives in the hub's `.agents/sessions/`, managed by the `sessions` tool from `agents-coding-workflow`. Create missing working-state files only when the task needs them; an absent project guide is not permission to substitute another project's guide.
```

## Files to delete

- `.agents/skills/agents-coding-workflow/references/CONTROLS-FORMAT.md`, entire file, L1 to L19
- `.agents/CONTROLS.md`, entire file, L1 to L2
`````
