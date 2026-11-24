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
