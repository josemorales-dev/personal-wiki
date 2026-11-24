import type { Outcome, Parsed } from "./session.ts";

/** The difit release the sessions tool runs, pinned so a new release never changes the review mid-session. */
export const DIFIT = "difit@5.0.12";

/** A difit server running in the background. */
export type DifitServer = { readonly url: string; readonly port: number; readonly pid: number };

/** Starts difit in `directory` with `args`; the server outlives this process. */
export function startDifit(directory: string, args: readonly string[]): Parsed<DifitServer> {
  const result = Bun.spawnSync(["bunx", DIFIT, ...args], { cwd: directory, stdin: "ignore", stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) return { ok: false, error: `difit failed to start: ${result.stderr.toString().trim()}` };
  return parseDifitServer(result.stdout.toString());
}

/**
 * Stops the difit server running as `pid`. A pid with no process left counts as stopped, and a pid that `ps` shows
 * running something other than difit is left alone, so a reused pid never stops another program.
 */
export function stopDifit(pid: number): Outcome {
  const command = Bun.spawnSync(["ps", "-o", "command=", "-p", String(pid)], { stdout: "pipe", stderr: "pipe" });
  if (command.exitCode !== 0 || !command.stdout.toString().includes("difit")) return { ok: true };
  try {
    process.kill(pid, "SIGTERM");
    return { ok: true };
  } catch (error: unknown) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Opens `url` in Google Chrome and brings Chrome to the front. Uses macOS `open`. */
export function openInChrome(url: string): Outcome {
  const result = Bun.spawnSync(["open", "-a", "Google Chrome", url], { stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) return { ok: false, error: result.stderr.toString().trim() };
  return { ok: true };
}

/** Reads the `{"port":…,"url":…,"pid":…}` line that `difit --background` prints once its server is up. */
export function parseDifitServer(output: string): Parsed<DifitServer> {
  for (const line of output.split("\n").reverse()) {
    try {
      const value: unknown = JSON.parse(line);
      if (typeof value === "object" && value !== null && "port" in value && "url" in value && "pid" in value) {
        const { port, url, pid } = value;
        if (typeof port === "number" && typeof url === "string" && typeof pid === "number") {
          return { ok: true, value: { port, url, pid } };
        }
      }
    } catch {
      // Not the JSON line; keep looking.
    }
  }
  return { ok: false, error: `difit printed no server address: ${output.trim()}` };
}
