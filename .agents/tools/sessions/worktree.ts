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
