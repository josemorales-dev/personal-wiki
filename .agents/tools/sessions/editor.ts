import type { Outcome } from "./session.ts";

const SHOW_CHANGES_URL = "vscode://local.vscode-review/show-changes";

/**
 * Opens `worktree` and `plan` in VS Code, then sends the vscode-review extension the URL that shows the Changes
 * editor. VS Code delivers the URL to the window it just focused, even when that window was already open.
 */
export function openReview(worktree: string, plan: string): Outcome {
  const opened = run(["code", worktree, plan]);
  if (!opened.ok) return opened;
  return run(["open", SHOW_CHANGES_URL]);
}

function run(command: readonly string[]): Outcome {
  const result = Bun.spawnSync([...command], { stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) return { ok: false, error: `'${command.join(" ")}' failed: ${result.stderr.toString().trim()}` };
  return { ok: true };
}
