import { cpSync, mkdirSync } from "node:fs";
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

/** Diff options that override the user's Git config, so the patch always applies and renames list both paths. */
const PLAIN_DIFF: readonly string[] = ["--no-color", "--no-ext-diff", "--no-renames", "--src-prefix=a/", "--dst-prefix=b/"];

/**
 * Copies the repository's uncommitted changes, staged or not, and its untracked files that Git does not ignore into
 * `worktree`, where they stay uncommitted. Returns the carried paths, sorted.
 */
export function carryUncommitted(repo: string, worktree: string): Parsed<readonly string[]> {
  const changed = git(repo, ["diff", ...PLAIN_DIFF, "HEAD", "--name-only", "-z"]);
  if (!changed.ok) return { ok: false, error: changed.error };
  const untracked = git(repo, ["ls-files", "--others", "--exclude-standard", "-z"]);
  if (!untracked.ok) return { ok: false, error: untracked.error };
  const changedPaths = nulSeparated(changed.output);
  if (changedPaths.length > 0) {
    const patch = Bun.spawnSync(["git", "-C", repo, "diff", ...PLAIN_DIFF, "HEAD", "--binary"], { stdout: "pipe", stderr: "pipe" });
    const applied = Bun.spawnSync(["git", "-C", worktree, "apply", "--binary", "-"], {
      stdin: patch.stdout,
      stdout: "pipe",
      stderr: "pipe",
    });
    if (patch.exitCode !== 0 || applied.exitCode !== 0) {
      return { ok: false, error: `${patch.stderr.toString()}${applied.stderr.toString()}`.trim() };
    }
  }
  // Git lists an untracked nested repository as its folder, ending in a slash. It is left behind.
  const untrackedPaths = nulSeparated(untracked.output).filter((path) => !path.endsWith("/"));
  try {
    for (const path of untrackedPaths) {
      mkdirSync(dirname(join(worktree, path)), { recursive: true });
      cpSync(join(repo, path), join(worktree, path), { verbatimSymlinks: true });
    }
  } catch (error: unknown) {
    return { ok: false, error: `could not copy untracked files: ${error instanceof Error ? error.message : String(error)}` };
  }
  return { ok: true, value: [...new Set([...changedPaths, ...untrackedPaths])].sort() };
}

/** Whether the two refs name the same commit. */
export function sameCommit(repo: string, first: string, second: string): boolean {
  const commitOf = (ref: string): GitResult => git(repo, ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
  const left = commitOf(first);
  const right = commitOf(second);
  return left.ok && right.ok && left.output === right.output;
}

function nulSeparated(output: string): readonly string[] {
  return output.split("\0").filter((path) => path !== "");
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

/** Removes a draft worktree even when it has uncommitted or untracked changes. */
export function discardWorktree(repo: string, path: string): GitOutcome {
  return git(repo, ["worktree", "remove", "--force", path]);
}

/** Deletes a draft branch even when it is not merged. */
export function discardBranch(repo: string, branch: string): GitOutcome {
  return git(repo, ["branch", "-D", branch]);
}
