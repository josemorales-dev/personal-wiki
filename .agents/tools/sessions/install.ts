import { posix } from "node:path";
import type { Outcome } from "./session.ts";

/** A frozen dependency install, run in `directory` relative to the repository root. */
export type Install = { readonly directory: string; readonly command: readonly string[] };

const FROZEN_INSTALLS: ReadonlyMap<string, readonly string[]> = new Map([
  ["bun.lock", ["bun", "install", "--frozen-lockfile"]],
  ["bun.lockb", ["bun", "install", "--frozen-lockfile"]],
  ["package-lock.json", ["npm", "ci"]],
  ["pnpm-lock.yaml", ["pnpm", "install", "--frozen-lockfile"]],
  ["yarn.lock", ["yarn", "install", "--frozen-lockfile"]],
]);

/** Runs an install `command` in `directory`. A missing executable is a failure, not a crash. */
export function runInstall(directory: string, command: readonly string[]): Outcome {
  try {
    const result = Bun.spawnSync([...command], { cwd: directory, stdin: "ignore", stdout: "pipe", stderr: "pipe" });
    return result.exitCode === 0 ? { ok: true } : { ok: false, error: result.stderr.toString().trim() };
  } catch (error: unknown) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** The frozen install for each folder holding a lockfile among `paths`, sorted by folder. */
export function installCommands(paths: readonly string[]): readonly Install[] {
  const byDirectory = new Map<string, Install>();
  for (const path of paths) {
    const command = FROZEN_INSTALLS.get(posix.basename(path));
    const directory = posix.dirname(path);
    if (command !== undefined && !byDirectory.has(directory)) byDirectory.set(directory, { directory, command });
  }
  return [...byDirectory.values()].sort((left, right) => left.directory.localeCompare(right.directory));
}
