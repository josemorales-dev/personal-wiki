#!/usr/bin/env bun
import { run } from "./cli.ts";
import { openInChrome, startDifit } from "./difit.ts";
import { runInstall } from "./install.ts";
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
  startDifit,
  openInChrome,
  runInstall,
  stdout: (text) => {
    process.stdout.write(text);
  },
  stderr: (text) => {
    process.stderr.write(text);
  },
});
