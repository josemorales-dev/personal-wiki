import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { run, type Context } from "./cli.ts";
import type { DifitServer } from "./difit.ts";
import type { Install } from "./install.ts";
import type { Outcome, Parsed } from "./session.ts";

const START = new Date("2026-11-24T12:00:00.000Z");
const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function temporaryDirectory(): string {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "sessions-test-")));
  temporaryDirectories.push(directory);
  return directory;
}

function git(directory: string, ...args: readonly string[]): string {
  const result = Bun.spawnSync(
    [
      "git",
      "-C",
      directory,
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.com",
      "-c",
      "commit.gpgsign=false",
      ...args,
    ],
    { stdout: "pipe", stderr: "pipe" },
  );
  if (result.exitCode !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr.toString()}`);
  }
  return result.stdout.toString().trim();
}

/** A project repository named `app` with one commit on `main`. */
function projectRepository(): string {
  const parent = temporaryDirectory();
  git(parent, "init", "--quiet", "--initial-branch=main", "app");
  const repo = join(parent, "app");
  writeFileSync(join(repo, "README.md"), "app\n");
  git(repo, "add", "README.md");
  git(repo, "commit", "--quiet", "--message", "Initial commit");
  return repo;
}

function worktreeOf(repo: string, id: string): string {
  return join(dirname(repo), "app.worktrees", id);
}

function commitIn(worktree: string, file: string): void {
  writeFileSync(join(worktree, file), `${file}\n`);
  git(worktree, "add", file);
  git(worktree, "commit", "--quiet", "--message", `Add ${file}`);
}

type Cli = {
  readonly hub: string;
  sessions(...argv: readonly string[]): number;
  stdout(): string;
  stderr(): string;
  json(): unknown;
  advanceMinutes(minutes: number): void;
  /** Each call the CLI made to start difit, in order. */
  difitCalls(): readonly DifitCall[];
  /** Makes the next difit start fail with `error`. */
  failDifit(error: string): void;
  /** Each URL the CLI opened in Chrome, in order. */
  openedUrls(): readonly string[];
  /** Makes the next attempt to open Chrome fail with `error`. */
  failChrome(error: string): void;
  /** Each difit pid the CLI stopped, in order. */
  stoppedPids(): readonly number[];
  /** Makes every attempt to stop difit fail with `error`. */
  failStops(error: string): void;
  /** Sets the server the next difit start returns. */
  nextDifit(server: DifitServer): void;
  /** Each install the CLI ran, in order. */
  installs(): readonly Install[];
  /** Makes every install fail with `error`. */
  failInstalls(error: string): void;
};

type DifitCall = { readonly directory: string; readonly args: readonly string[] };

const DIFIT_SERVER: DifitServer = { port: 4967, url: "http://localhost:4967", pid: 4242 };

function cli(color = false): Cli {
  const hub = temporaryDirectory();
  let now = START;
  let stdout = "";
  let stderr = "";
  const difitCalls: DifitCall[] = [];
  let difitResult: Parsed<DifitServer> = { ok: true, value: DIFIT_SERVER };
  const openedUrls: string[] = [];
  let chromeResult: Outcome = { ok: true };
  const stoppedPids: number[] = [];
  let stopResult: Outcome = { ok: true };
  const installs: Install[] = [];
  let installResult: Outcome = { ok: true };
  const context: Context = {
    hubRoot: hub,
    color,
    now: () => now,
    stdout: (text) => {
      stdout += text;
    },
    stderr: (text) => {
      stderr += text;
    },
    startDifit: (directory, args) => {
      difitCalls.push({ directory, args });
      return difitResult;
    },
    stopDifit: (pid) => {
      stoppedPids.push(pid);
      return stopResult;
    },
    openInChrome: (url) => {
      openedUrls.push(url);
      return chromeResult;
    },
    runInstall: (directory, command) => {
      installs.push({ directory, command });
      return installResult;
    },
  };
  return {
    hub,
    sessions(...argv) {
      stdout = "";
      stderr = "";
      return run(argv, context);
    },
    stdout: () => stdout,
    stderr: () => stderr,
    json: (): unknown => JSON.parse(stdout),
    advanceMinutes(minutes) {
      now = new Date(now.getTime() + minutes * 60_000);
    },
    difitCalls: () => difitCalls,
    failDifit(error) {
      difitResult = { ok: false, error };
    },
    openedUrls: () => openedUrls,
    stoppedPids: () => stoppedPids,
    failStops(error) {
      stopResult = { ok: false, error };
    },
    nextDifit(server) {
      difitResult = { ok: true, value: server };
    },
    failChrome(error) {
      chromeResult = { ok: false, error };
    },
    installs: () => installs,
    failInstalls(error) {
      installResult = { ok: false, error };
    },
  };
}

function start(c: Cli, repo: string, id: string): void {
  expect(c.sessions("start", id, "--repo", repo, "--tool", "claude")).toBe(0);
}

describe("help", () => {
  test("lists every command when run without arguments", () => {
    const c = cli();
    expect(c.sessions()).toBe(0);
    for (const command of ["start", "list", "show", "update", "difit", "land", "finish", "check-format"]) {
      expect(c.stdout()).toContain(command);
    }
  });

  test("shows a command's options with --help", () => {
    const c = cli();
    expect(c.sessions("start", "--help")).toBe(0);
    expect(c.stdout()).toContain("--repo <path>");
  });

  test("rejects an unknown command with a usage error", () => {
    const c = cli();
    expect(c.sessions("frobnicate")).toBe(2);
    expect(c.stderr()).toContain("unknown command 'frobnicate'");
    expect(c.stderr()).toContain("sessions help");
  });
});

describe("start", () => {
  test("creates a sibling worktree on a branch named after the session", () => {
    const repo = projectRepository();
    const c = cli();
    expect(c.sessions("start", "add-login", "--repo", repo, "--tool", "claude", "--json")).toBe(0);
    expect(c.json()).toMatchObject({
      id: "add-login",
      tool: "claude",
      repo,
      worktree: worktreeOf(repo, "add-login"),
      branch: "add-login",
      base: "main",
      status: "aligning",
      scope: [],
      folder: join(c.hub, ".agents", "sessions", "add-login"),
      stale: false,
      overlaps: [],
    });
    expect(git(worktreeOf(repo, "add-login"), "branch", "--show-current")).toBe("add-login");
  });

  test("prints the worktree and the session folder", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    expect(c.stdout()).toContain(worktreeOf(repo, "add-login"));
    expect(c.stdout()).toContain(join(c.hub, ".agents", "sessions", "add-login"));
  });

  test("resolves --repo from a folder inside the repository", () => {
    const repo = projectRepository();
    mkdirSync(join(repo, "src"));
    const c = cli();
    expect(c.sessions("start", "add-login", "--repo", join(repo, "src"), "--tool", "codex", "--json")).toBe(0);
    expect(c.json()).toMatchObject({ repo, tool: "codex", worktree: worktreeOf(repo, "add-login") });
  });

  test("rejects an id that is not kebab-case", () => {
    const repo = projectRepository();
    const c = cli();
    expect(c.sessions("start", "Add_Login", "--repo", repo, "--tool", "claude")).toBe(2);
    expect(c.stderr()).toContain("invalid session id");
    expect(existsSync(worktreeOf(repo, "Add_Login"))).toBe(false);
  });

  test("rejects an unknown tool", () => {
    const repo = projectRepository();
    const c = cli();
    expect(c.sessions("start", "add-login", "--repo", repo, "--tool", "cursor")).toBe(2);
    expect(c.stderr()).toContain("invalid tool 'cursor'");
  });

  test("rejects an id that is already in use", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    expect(c.sessions("start", "add-login", "--repo", repo, "--tool", "codex")).toBe(1);
    expect(c.stderr()).toContain("session 'add-login' already exists");
  });

  test("rejects a path outside any Git repository", () => {
    const c = cli();
    expect(c.sessions("start", "add-login", "--repo", temporaryDirectory(), "--tool", "claude")).toBe(1);
    expect(c.stderr()).toContain("not a Git repository");
  });

  test("frees the id when the worktree cannot be created", () => {
    const repo = projectRepository();
    git(repo, "branch", "add-login");
    const c = cli();
    expect(c.sessions("start", "add-login", "--repo", repo, "--tool", "claude")).toBe(1);
    expect(c.stderr()).toContain("could not create the worktree");
    git(repo, "branch", "--delete", "add-login");
    start(c, repo, "add-login");
  });

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

  test("lists the carried files and says difit shows them", () => {
    const repo = projectRepository();
    writeFileSync(join(repo, "README.md"), "app, edited\n");
    const c = cli();
    start(c, repo, "add-login");
    expect(c.stdout()).toContain("README.md");
    expect(c.stdout()).toContain("difit shows them with the draft");
  });

  test("carries nothing when --base names another commit", () => {
    const repo = projectRepository();
    git(repo, "branch", "release");
    commitIn(repo, "CHANGELOG.md");
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

  test("carries changes whatever the user's diff settings", () => {
    const repo = projectRepository();
    git(repo, "config", "diff.noprefix", "true");
    git(repo, "config", "color.diff", "always");
    writeFileSync(join(repo, "README.md"), "app, edited\n");
    const c = cli();
    start(c, repo, "add-login");
    expect(readFileSync(join(worktreeOf(repo, "add-login"), "README.md"), "utf8")).toBe("app, edited\n");
  });

  test("lists both paths of a staged rename", () => {
    const repo = projectRepository();
    git(repo, "mv", "README.md", "GUIDE.md");
    const c = cli();
    expect(c.sessions("start", "add-login", "--repo", repo, "--tool", "claude", "--json")).toBe(0);
    expect(c.json()).toMatchObject({ carried: ["GUIDE.md", "README.md"] });
    expect(existsSync(join(worktreeOf(repo, "add-login"), "README.md"))).toBe(false);
  });

  test("skips an untracked nested repository and carries the rest", () => {
    const repo = projectRepository();
    git(repo, "init", "--quiet", "nested");
    writeFileSync(join(repo, "nested", "inner.md"), "inner\n");
    writeFileSync(join(repo, "notes.md"), "notes\n");
    const c = cli();
    expect(c.sessions("start", "add-login", "--repo", repo, "--tool", "claude", "--json")).toBe(0);
    expect(c.json()).toMatchObject({ carried: ["notes.md"] });
  });

  test("runs the frozen install for each tracked lockfile in the worktree", () => {
    const repo = projectRepository();
    mkdirSync(join(repo, "tools"));
    writeFileSync(join(repo, "tools", "bun.lock"), "{}\n");
    writeFileSync(join(repo, "package-lock.json"), "{}\n");
    git(repo, "add", ".");
    git(repo, "commit", "--quiet", "--message", "Add lockfiles");
    const c = cli();
    expect(c.sessions("start", "add-login", "--repo", repo, "--tool", "claude", "--json")).toBe(0);
    const worktree = worktreeOf(repo, "add-login");
    expect(c.installs()).toEqual([
      { directory: join(worktree, "."), command: ["npm", "ci"] },
      { directory: join(worktree, "tools"), command: ["bun", "install", "--frozen-lockfile"] },
    ]);
    expect(c.json()).toMatchObject({ installed: [".", "tools"] });
  });

  test("warns about a failed install and still starts the session", () => {
    const repo = projectRepository();
    writeFileSync(join(repo, "bun.lock"), "{}\n");
    git(repo, "add", "bun.lock");
    git(repo, "commit", "--quiet", "--message", "Add lockfile");
    const c = cli();
    c.failInstalls("lockfile had changes");
    start(c, repo, "add-login");
    expect(c.stderr()).toContain("'bun install --frozen-lockfile' failed in .: lockfile had changes");
    expect(existsSync(worktreeOf(repo, "add-login"))).toBe(true);
  });

  test("runs no install without a lockfile", () => {
    const c = cli();
    start(c, projectRepository(), "add-login");
    expect(c.installs()).toEqual([]);
  });

  test("carries when --base names the current commit", () => {
    const repo = projectRepository();
    writeFileSync(join(repo, "README.md"), "app, edited\n");
    const c = cli();
    expect(c.sessions("start", "add-login", "--repo", repo, "--tool", "claude", "--base", "HEAD", "--json")).toBe(0);
    expect(c.json()).toMatchObject({ carried: ["README.md"] });
  });
});

describe("show", () => {
  test("describes a session", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    expect(c.sessions("show", "add-login")).toBe(0);
    expect(c.stdout()).toContain("aligning");
    expect(c.stdout()).toContain(worktreeOf(repo, "add-login"));
    expect(c.stdout()).toContain("add-login from main");
  });

  test("fails for a session that does not exist", () => {
    const c = cli();
    expect(c.sessions("show", "ghost")).toBe(1);
    expect(c.stderr()).toContain("no active session 'ghost'");
  });
});

describe("update", () => {
  test("records a new status and a normalized scope", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    c.advanceMinutes(3);
    expect(
      c.sessions("update", "add-login", "--status", "building", "--scope", "./src/auth/", "--scope", "README.md", "--json"),
    ).toBe(0);
    expect(c.json()).toMatchObject({
      status: "building",
      scope: ["src/auth", "README.md"],
      updated: "2026-11-24T12:03:00.000Z",
    });
  });

  test("keeps the scope when only the status changes", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    expect(c.sessions("update", "add-login", "--scope", "src/auth")).toBe(0);
    expect(c.sessions("update", "add-login", "--status", "reviewing", "--json")).toBe(0);
    expect(c.json()).toMatchObject({ status: "reviewing", scope: ["src/auth"] });
  });

  test("rejects an unknown status", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    expect(c.sessions("update", "add-login", "--status", "coding")).toBe(2);
    expect(c.stderr()).toContain("invalid status 'coding'");
  });

  test("leaves the done status to finish", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    expect(c.sessions("update", "add-login", "--status", "done")).toBe(2);
    expect(c.stderr()).toContain("sessions finish");
  });

  test("rejects a scope path outside the repository", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    expect(c.sessions("update", "add-login", "--scope", "../other")).toBe(2);
    expect(c.stderr()).toContain("invalid scope path '../other'");
  });

  test("refuses to build a scope that another session is building in the same repository", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    start(c, repo, "fix-auth");
    expect(c.sessions("update", "add-login", "--status", "building", "--scope", "src/auth")).toBe(0);
    expect(c.sessions("update", "fix-auth", "--status", "building", "--scope", "src/auth/token.ts")).toBe(1);
    expect(c.stderr()).toContain("add-login is already building an overlapping scope in app");
    expect(c.sessions("show", "fix-auth", "--json")).toBe(0);
    expect(c.json()).toMatchObject({ status: "aligning", scope: [] });
  });

  test("refuses to build without a scope", () => {
    const c = cli();
    start(c, projectRepository(), "add-login");
    expect(c.sessions("update", "add-login", "--status", "building")).toBe(1);
    expect(c.stderr()).toContain("a session needs a scope before it builds");
  });

  test("builds alongside a session whose scope does not overlap", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    start(c, repo, "fix-docs");
    expect(c.sessions("update", "add-login", "--status", "building", "--scope", "src/auth")).toBe(0);
    expect(c.sessions("update", "fix-docs", "--status", "building", "--scope", "docs")).toBe(0);
  });

  test("requires a status or a scope", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    expect(c.sessions("update", "add-login")).toBe(2);
    expect(c.stderr()).toContain("nothing to update");
  });

  test("fails for a session that does not exist", () => {
    const c = cli();
    expect(c.sessions("update", "ghost", "--status", "building")).toBe(1);
    expect(c.stderr()).toContain("no active session 'ghost'");
  });
});

describe("list", () => {
  test("says so when no session is active", () => {
    const c = cli();
    expect(c.sessions("list")).toBe(0);
    expect(c.stdout()).toContain("No active sessions.");
  });

  test("shows each session with its tool, repository, status, and age", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    c.advanceMinutes(5);
    expect(c.sessions("list")).toBe(0);
    expect(c.stdout()).toMatch(/add-login\s+claude\s+app\s+aligning\s+5m ago/);
  });

  test("flags sessions in the same repository whose scopes share a path", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    start(c, repo, "fix-auth");
    expect(c.sessions("update", "add-login", "--scope", "src/auth")).toBe(0);
    expect(c.sessions("update", "fix-auth", "--scope", "src/auth/token.ts")).toBe(0);
    expect(c.sessions("list", "--json")).toBe(0);
    expect(c.json()).toMatchObject([
      { id: "add-login", overlaps: ["fix-auth"] },
      { id: "fix-auth", overlaps: ["add-login"] },
    ]);
  });

  test("ignores shared paths in different repositories", () => {
    const c = cli();
    start(c, projectRepository(), "add-login");
    start(c, projectRepository(), "fix-auth");
    expect(c.sessions("update", "add-login", "--scope", "src")).toBe(0);
    expect(c.sessions("update", "fix-auth", "--scope", "src")).toBe(0);
    expect(c.sessions("list", "--json")).toBe(0);
    expect(c.json()).toMatchObject([
      { id: "add-login", overlaps: [] },
      { id: "fix-auth", overlaps: [] },
    ]);
  });

  test("flags a session whose worktree is missing", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    git(repo, "worktree", "remove", worktreeOf(repo, "add-login"));
    expect(c.sessions("list")).toBe(0);
    expect(c.stdout()).toContain("stale: worktree missing");
  });

  test("warns about an unreadable session file and lists the rest", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    const broken = join(c.hub, ".agents", "sessions", "broken");
    mkdirSync(broken);
    writeFileSync(join(broken, "session.json"), "{");
    expect(c.sessions("list")).toBe(0);
    expect(c.stderr()).toContain("skipped broken");
    expect(c.stdout()).toContain("add-login");
  });

  test("colors output only when color is enabled", () => {
    const repo = projectRepository();
    const plain = cli();
    start(plain, repo, "add-login");
    expect(plain.sessions("list")).toBe(0);
    expect(plain.stdout()).not.toContain("\u001b[");

    const colored = cli(true);
    start(colored, repo, "fix-auth");
    expect(colored.sessions("list")).toBe(0);
    expect(colored.stdout()).toContain("\u001b[");
  });
});

describe("difit", () => {
  test("opens difit on the worktree against the session base, with untracked files", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    expect(c.sessions("difit", "add-login")).toBe(0);
    expect(c.difitCalls()).toEqual([
      {
        directory: worktreeOf(repo, "add-login"),
        args: [".", "main", "--merge-base", "--include-untracked", "--background", "--no-open"],
      },
    ]);
  });

  test("prints the URL and the port for reading comments", () => {
    const c = cli();
    start(c, projectRepository(), "add-login");
    expect(c.sessions("difit", "add-login")).toBe(0);
    expect(c.stdout()).toContain("http://localhost:4967/?session=add-login");
    expect(c.stdout()).toContain("comment get --port 4967 --format json");
  });

  test("opens the review in Chrome", () => {
    const c = cli();
    start(c, projectRepository(), "add-login");
    expect(c.sessions("difit", "add-login")).toBe(0);
    expect(c.openedUrls()).toEqual(["http://localhost:4967/?session=add-login"]);
  });

  test("warns and still prints the URL when Chrome does not open", () => {
    const c = cli();
    start(c, projectRepository(), "add-login");
    c.failChrome("Unable to find application named 'Google Chrome'");
    expect(c.sessions("difit", "add-login")).toBe(0);
    expect(c.stderr()).toContain("could not open Chrome: Unable to find application named 'Google Chrome'");
    expect(c.stdout()).toContain("http://localhost:4967");
  });

  test("stops the session's previous server before starting a new one", () => {
    const c = cli();
    start(c, projectRepository(), "add-login");
    expect(c.sessions("difit", "add-login")).toBe(0);
    expect(c.stoppedPids()).toEqual([]);
    c.nextDifit({ port: 4968, url: "http://localhost:4968", pid: 5353 });
    expect(c.sessions("difit", "add-login")).toBe(0);
    expect(c.stoppedPids()).toEqual([4242]);
  });

  test("leaves other sessions' servers running", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    start(c, repo, "fix-auth");
    expect(c.sessions("difit", "add-login")).toBe(0);
    expect(c.sessions("difit", "fix-auth")).toBe(0);
    expect(c.stoppedPids()).toEqual([]);
  });

  test("fails with difit's error when the server does not start", () => {
    const c = cli();
    start(c, projectRepository(), "add-login");
    c.failDifit("difit failed to start: boom");
    expect(c.sessions("difit", "add-login")).toBe(1);
    expect(c.stderr()).toContain("difit failed to start: boom");
  });

  test("fails without starting difit when the worktree is missing", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    rmSync(worktreeOf(repo, "add-login"), { recursive: true, force: true });
    expect(c.sessions("difit", "add-login")).toBe(1);
    expect(c.stderr()).toContain("is missing");
    expect(c.difitCalls()).toEqual([]);
  });

  test("fails for a session that does not exist", () => {
    const c = cli();
    expect(c.sessions("difit", "ghost")).toBe(1);
    expect(c.stderr()).toContain("no active session 'ghost'");
  });
});

describe("land", () => {
  test("copies changed and new draft files into main", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    const worktree = worktreeOf(repo, "add-login");
    writeFileSync(join(worktree, "README.md"), "app, drafted\n");
    mkdirSync(join(worktree, "src"));
    writeFileSync(join(worktree, "src", "login.ts"), "login\n");
    expect(c.sessions("land", "add-login", "README.md", "src/login.ts")).toBe(0);
    expect(readFileSync(join(repo, "README.md"), "utf8")).toBe("app, drafted\n");
    expect(readFileSync(join(repo, "src", "login.ts"), "utf8")).toBe("login\n");
    expect(c.stdout()).toMatch(/copied\s+src\/login\.ts/);
  });

  test("deletes in main a file the draft deleted", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    rmSync(join(worktreeOf(repo, "add-login"), "README.md"));
    expect(c.sessions("land", "add-login", "README.md")).toBe(0);
    expect(existsSync(join(repo, "README.md"))).toBe(false);
    expect(c.stdout()).toMatch(/deleted\s+README\.md/);
  });

  test("lands nothing when a path is not in the draft", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    writeFileSync(join(worktreeOf(repo, "add-login"), "README.md"), "app, drafted\n");
    expect(c.sessions("land", "add-login", "README.md", "src/ghost.ts")).toBe(1);
    expect(c.stderr()).toContain("src/ghost.ts is not in the draft");
    expect(readFileSync(join(repo, "README.md"), "utf8")).toBe("app\n");
  });

  test("keeps a file that exists only in main", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    writeFileSync(join(repo, "notes.md"), "mine\n");
    expect(c.sessions("land", "add-login", "notes.md")).toBe(1);
    expect(c.stderr()).toContain("notes.md is not in the draft");
    expect(readFileSync(join(repo, "notes.md"), "utf8")).toBe("mine\n");
  });

  test("refuses a folder", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    mkdirSync(join(worktreeOf(repo, "add-login"), "src"));
    writeFileSync(join(worktreeOf(repo, "add-login"), "src", "login.ts"), "login\n");
    expect(c.sessions("land", "add-login", "src")).toBe(1);
    expect(c.stderr()).toContain("src is a folder; land its files one by one");
    expect(existsSync(join(repo, "src"))).toBe(false);
  });

  test("rejects a path outside the repository", () => {
    const c = cli();
    start(c, projectRepository(), "add-login");
    expect(c.sessions("land", "add-login", "../other")).toBe(2);
    expect(c.stderr()).toContain("invalid scope path '../other'");
  });

  test("requires a path", () => {
    const c = cli();
    start(c, projectRepository(), "add-login");
    expect(c.sessions("land", "add-login")).toBe(2);
    expect(c.stderr()).toContain("missing <path>");
  });
});

describe("finish", () => {
  test("refuses a branch that is not merged and keeps the worktree", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    commitIn(worktreeOf(repo, "add-login"), "login.ts");
    expect(c.sessions("finish", "add-login")).toBe(1);
    expect(c.stderr()).toContain("branch 'add-login' is not merged into 'main'");
    expect(existsSync(worktreeOf(repo, "add-login"))).toBe(true);
  });

  test("removes the worktree and branch of a merged session and archives it", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    commitIn(worktreeOf(repo, "add-login"), "login.ts");
    git(repo, "merge", "--quiet", "add-login");
    expect(c.sessions("finish", "add-login")).toBe(0);
    expect(existsSync(worktreeOf(repo, "add-login"))).toBe(false);
    expect(git(repo, "branch", "--list", "add-login")).toBe("");
    expect(c.sessions("list")).toBe(0);
    expect(c.stdout()).toContain("No active sessions.");
    const archived: unknown = JSON.parse(
      readFileSync(join(c.hub, ".agents", "archive", "sessions", "add-login", "session.json"), "utf8"),
    );
    expect(archived).toMatchObject({ id: "add-login", status: "done" });
  });

  test("keeps a worktree with uncommitted changes", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    writeFileSync(join(worktreeOf(repo, "add-login"), "draft.ts"), "draft\n");
    expect(c.sessions("finish", "add-login")).toBe(1);
    expect(c.stderr()).toContain("could not remove the worktree");
    expect(existsSync(worktreeOf(repo, "add-login"))).toBe(true);
  });

  test("cleans up a session whose worktree folder was deleted by hand", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    rmSync(worktreeOf(repo, "add-login"), { recursive: true, force: true });
    expect(c.sessions("finish", "add-login")).toBe(0);
    expect(git(repo, "branch", "--list", "add-login")).toBe("");
  });

  test("discards an unmerged draft with uncommitted and untracked changes when asked", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    const worktree = worktreeOf(repo, "add-login");
    commitIn(worktree, "login.ts");
    writeFileSync(join(worktree, "README.md"), "app, drafted\n");
    writeFileSync(join(worktree, "draft.ts"), "draft\n");
    expect(c.sessions("finish", "add-login", "--discard-draft")).toBe(0);
    expect(existsSync(worktree)).toBe(false);
    expect(git(repo, "branch", "--list", "add-login")).toBe("");
    expect(existsSync(join(c.hub, ".agents", "archive", "sessions", "add-login"))).toBe(true);
  });

  test("stops the session's difit server and reports it", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    expect(c.sessions("difit", "add-login")).toBe(0);
    expect(c.sessions("finish", "add-login", "--discard-draft")).toBe(0);
    expect(c.stoppedPids()).toEqual([4242]);
    expect(c.stdout()).toContain("stopped the server on port 4967");
    expect(existsSync(join(c.hub, ".agents", "archive", "sessions", "add-login", "difit.json"))).toBe(false);
  });

  test("keeps the review running when finish is refused", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    commitIn(worktreeOf(repo, "add-login"), "login.ts");
    expect(c.sessions("difit", "add-login")).toBe(0);
    expect(c.sessions("finish", "add-login")).toBe(1);
    expect(c.stoppedPids()).toEqual([]);
  });

  test("warns when the server does not stop and still finishes", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    expect(c.sessions("difit", "add-login")).toBe(0);
    c.failStops("operation not permitted");
    expect(c.sessions("finish", "add-login", "--discard-draft")).toBe(0);
    expect(c.stderr()).toContain("could not stop difit on port 4967: operation not permitted");
  });

  test("keeps an archived id reserved", () => {
    const repo = projectRepository();
    const c = cli();
    start(c, repo, "add-login");
    expect(c.sessions("finish", "add-login")).toBe(0);
    expect(c.sessions("start", "add-login", "--repo", repo, "--tool", "claude")).toBe(1);
    expect(c.stderr()).toContain("session 'add-login' already exists");
  });
});

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

  test("confirms a plan that follows the format", () => {
    const c = cli();
    startWithPlan(c, "add-login");
    expect(c.sessions("check-format", "add-login")).toBe(0);
    expect(c.stdout()).toContain("PLAN.md follows the format");
  });

  test("lists each problem with its file and line, and fails", () => {
    const c = cli();
    start(c, projectRepository(), "add-login");
    writeSessionFile(c, "add-login", "PLAN.md", ["# Add login", "", "## Notes"]);
    expect(c.sessions("check-format", "add-login")).toBe(1);
    expect(c.stderr()).toContain("PLAN.md:3: '## Notes' must be '## Task N: <verb phrase>' or '## Handoff'");
  });

  test("fails for a session that does not exist", () => {
    const c = cli();
    expect(c.sessions("check-format", "ghost")).toBe(1);
    expect(c.stderr()).toContain("ghost");
  });
});
