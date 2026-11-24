# Stop a session's difit server when it is done

## Task 1: track and stop the session's difit server

- Status: not started
- Goal: `sessions finish` stops the session's difit server, and `sessions difit` stops the previous one before it starts a new one.

Notes:

- `difit --background` prints the server's `pid`. `sessions difit` saves the pid and port to `difit.json` in the session folder.
- The tool stops a pid only while `ps` shows a difit command for it, so a reused pid never stops another program. A pid with no process left counts as stopped.
- A server that fails to stop prints a warning; `difit` and `finish` still go on.
- `finish` stops the server after the merge check passes, so a refused `finish` leaves the review running.
- `Context` gets `stopDifit`, so tests check which pids stop without real processes.

Scope:

| Path                                      | Change                                         |
| ----------------------------------------- | ---------------------------------------------- |
| `.agents/tools/sessions/difit.ts`         | `pid` in `DifitServer`, `stopDifit`            |
| `.agents/tools/sessions/difit.test.ts`    | parse tests with `pid`                          |
| `.agents/tools/sessions/session-store.ts` | save, load, and forget the session's server    |
| `.agents/tools/sessions/cli.ts`           | stop in `difit` and `finish`, help text        |
| `.agents/tools/sessions/main.ts`          | real `stopDifit`                               |
| `.agents/tools/sessions/sessions.test.ts` | tests for `difit` and `finish`                 |

Seams:

| Interface                       | Behaviour the tests observe                                         |
| ------------------------------- | ------------------------------------------------------------------- |
| `run(["difit", id], ctx)`       | stops the pid saved by the previous run, then saves the new one     |
| `run(["finish", id, ...], ctx)` | stops the saved pid and reports it; a refused finish stops nothing  |
| `parseDifitServer(output)`      | reads `pid` with the port and URL                                    |

Checks:

- `bun run check` in `.agents/tools/sessions` passes, and the new tests fail before the change.
- A real `sessions difit` run twice leaves one difit server for the session, and `sessions finish --discard-draft` leaves none.
