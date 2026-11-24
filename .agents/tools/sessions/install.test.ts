import { describe, expect, test } from "bun:test";
import { tmpdir } from "node:os";
import { installCommands, runInstall } from "./install.ts";

describe("installCommands", () => {
  test("maps each lockfile to its frozen install, in the lockfile's folder", () => {
    expect(installCommands(["web/package-lock.json", "bun.lock", "tools/pnpm-lock.yaml", "app/yarn.lock"])).toEqual([
      { directory: ".", command: ["bun", "install", "--frozen-lockfile"] },
      { directory: "app", command: ["yarn", "install", "--frozen-lockfile"] },
      { directory: "tools", command: ["pnpm", "install", "--frozen-lockfile"] },
      { directory: "web", command: ["npm", "ci"] },
    ]);
  });

  test("ignores files that are not lockfiles, whatever their name", () => {
    expect(installCommands(["README.md", "src/constructor", "package.json"])).toEqual([]);
  });

  test("runs one install per folder when a folder holds two lockfiles", () => {
    expect(installCommands(["bun.lock", "bun.lockb"])).toEqual([
      { directory: ".", command: ["bun", "install", "--frozen-lockfile"] },
    ]);
  });
});

describe("runInstall", () => {
  test("reports a missing executable as a failure", () => {
    const outcome = runInstall(tmpdir(), ["no-such-installer-for-sessions"]);
    expect(outcome).toEqual({ ok: false, error: expect.stringContaining("no-such-installer-for-sessions") });
  });

  test("reports a non-zero exit with its error output", () => {
    expect(runInstall(tmpdir(), ["sh", "-c", "echo broken >&2; exit 3"])).toEqual({ ok: false, error: "broken" });
  });
});
