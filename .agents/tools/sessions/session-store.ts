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
