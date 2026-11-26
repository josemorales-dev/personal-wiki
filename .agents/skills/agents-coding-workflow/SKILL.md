---
name: agents-coding-workflow
description: Software workflow for coding tasks in a code repository: scope, sessions, Git, and issues. Use when writing or changing code, taking Git actions, or working an issue or PRD.
---

Read [skill resource and project path rules](../PATHS.md) and the selected project's local instructions before applying this skill.

# Coding workflow

This is the workflow for writing software: code changes in a repository and the issues and PRDs that drive them. Notes, documents, spreadsheets, and skill writing follow their own skills.

## Standards

Every code change meets these on every route, a small change included:

- `agents-code-standards`, plus `agents-language-standards` where the language matches. Read their references before writing code. Draft reviews the draft against them; for a small change, Review does.
- `no-comments`. Draft runs it on the draft; a small change runs it in main before Review.
- unslop. Every artifact the user reads follows it; see Writing.

## Approval

Every approval is one question the user answers yes or no. End the reply with it on its own line, in this form: `Approve <exactly what a yes covers>? (yes/no)`. Name the session id or the small change's edit. Settle any other decision in an earlier reply, so the approval question is the only question. Only an explicit yes is approval; any other answer, including comments on the draft, means revise and ask again. Before a session's approval question, list the draft review's known limitations, or say there are none.

## Routes

Every coding change goes through a session: a `PLAN.md` and a draft of the change in the session worktree, reviewed together in VS Code and approved before the change is built test-first in the main checkout. The rule holds on every route, including tickets built with `/implement` or `/implement-spec`.

The one exception is a **small change**: the user named the exact edit, it touches one file, it removes no test, and it reverses no decision the user made earlier. A change that fails any part, or that you are unsure of, is a session.

| Size                   | Route                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Small change           | Name the route in one line and ask a yes-or-no about this change alone; no session. Checks and review still run.           |
| Fits one session       | One session.                                                                                                               |
| Spans several sessions | `/grill-with-docs` → `/to-spec` → `/to-tickets`; each ticket is one session, built with `/implement` or `/implement-spec`. |
| Too foggy to spec      | `/wayfinder` until the destination is a spec, then the row above.                                                          |

Slash commands are user-typed: name the command and ask the user to run it.

## The loop

Each step ends on its completion criterion. Move to the next step only once it holds.

0. **Size.** Before the first edit, name the route in one line of the reply: `Route: small change. <the edit>` or `Route: session <id>. <why it isn't small>`, measured against Routes. For a session, new or resumed, read [references/SESSIONS.md](references/SESSIONS.md) and start or resume it. Done when the line is in the reply and the session is running, or, for a small change, the user has approved that change alone (see Approval). A small change skips steps 1–4 and builds in main; steps 5–10 still run.
1. **Align.** For ambiguous, cross-module, or multi-step work, grill the user: load `grilling` and `domain-modeling`, or ask the user to type `/grill-with-docs` (or `/to-spec` when a spec is wanted). Done when the goal, the seams under test, and the checks are agreed and written in `PLAN.md`.
2. **Research.** When the code the goal touches is unfamiliar, dispatch an `Explore` subagent with the goal and ask for the files, flows, and constraints involved as `path:line` pointers. When the goal depends on why existing code is the way it is, run `why` on it. Write the findings to `RESEARCH.md` in the session folder. Read in full only the files you will change. Done when every path in the plan's `Scope` traces to a finding.
3. **Draft.** When the change adds or reshapes types, interfaces, or modules, run `architect` first. Write the whole proposed change, tests and code, in the session worktree, and leave it uncommitted. Run `no-comments` on the draft. Then review the draft. For a code change, run `code-review` in the worktree. Its fixed point is the worktree's `HEAD`, the main commit the session started from. Its spec is `PLAN.md`, and its standards are `agents-code-standards` plus `agents-language-standards` for each language in the diff. Start its subagents without asking. For a change to instructions or docs only, such as a skill, `AGENTS.md`, or a format reference, review the draft yourself against `writing-for-agents` and unslop. When the change touches shared code, name what else could break and the fact that makes it safe. Fix each finding in the draft, or record it under the plan's `Notes` as a known limitation. Done when every path in `Scope` is drafted, `no-comments` has reported, every review finding is fixed or recorded, and the plan's `Checks` pass in the worktree.
4. **Approve.** Run `sessions check-format <id>` and fix what it reports. Run `sessions review <id>`; it opens the worktree, `PLAN.md`, and the Changes editor with the draft's diff in VS Code. Keep the draft uncommitted and unstaged, or the Changes editor leaves it out. Ask for approval of the session (see Approval). The user comments in chat, naming the file and line. Revise the draft for each comment. Done when the user approves the plan and the draft.
5. **Route.** A bug or regression goes to `diagnosing-bugs`; new or changed behaviour goes to `tdd`; a question about module shape or seam placement goes to `codebase-design`.
6. **Build in main.** Rebuild the approved draft in the project's main checkout, one verifiable unit at a time. Each unit is red → green → refactor: land a test file with `sessions land <id> <path>` and watch it fail, land the draft code that turns it green, then clean up with the check still green. When a unit needs only part of a file, copy that part by hand. Refactor inside each unit, before the next red, even where `tdd` places refactoring at review. When main must differ materially from the draft, change the draft first, review the change as Draft does, run `sessions review <id>` again, and get a new yes; a refactor inside `Scope` that keeps the checks green is not material. Done when every unit in `Scope` is green in main; start the next unit only from a green state.
7. **Prove it works.** Run the plan's `Checks` in main this turn against the real artifact: typecheck and single test files during the work, the full suite once at the end. Quote each check's summary line and every failure, not the full log; pipe long output through `tail` or the runner's quiet reporter. A bug fix shows the reproduction failing before the fix and passing after. Done when every check has quoted output from this turn; "it compiles" and earlier runs are proxies, not proof.
8. **Review.** For a session, compare each `Scope` path in main with the approved draft, for example with `git diff --no-index <worktree>/<path> <path>`. Review each difference yourself, against the sources Draft uses and without subagents. For a small change, review its whole diff in main the same way. Done when each `Scope` path matches the draft or differs only by a reviewed refactor from Build in main, and every finding is fixed or reported as a known limitation.
9. **Spot-check.** Pick the 2–3 places in the diff most worth human eyes, each as `path:line` with the risk it carries and the check that covers it. Done when the list is in the final report.
10. **Ship.** Commit or open a PR only when authorized (see Git). Report the result, the spot-check list, remaining limitations, and changed paths.
11. **Learn.** When a mistake recurred, or review or a check let one through, suggest the user run `/retro`; a mechanical mistake becomes a lint rule, test, or hook. Done when the suggestion is made, or no mistake recurred.

## Writing

Every artifact the user reads follows the rules in [unslop](../unslop/SKILL.md): `PLAN.md`, `RESEARCH.md`, the final report, commit messages, PR bodies, and issues. Read the rules before writing the first artifact of a task, and check each artifact against them before presenting it. Verbatim content stays exact: proposed code and diffs, command output, and quotes.

## Authorization and scope

Carry out changes the user has authorized. An audit or review alone authorizes inspection and findings; an explicit request to fix or implement authorizes the scoped edits. Ask only for missing information, genuinely consequential approval, or a specific applicable project requirement.

## Project state

Use existing project conventions for documentation, memory, issues, and ADRs. If adopting the `.agents/` convention, project context goes in `.agents/docs/PROJECT_CONTEXT.md` and supplemental memory in `.agents/MEMORY.md` and `.agents/memories/`. Read only relevant current memory. An absent file does not require copying global or unrelated project state.

For issue or PRD work, read [references/issue-tracker.md](references/issue-tracker.md).

## Git

A guard (`.claude/hooks/guard-git.sh` for Claude Code, `.codex/rules/git-guardrails.rules` for Codex) asks the user before history-destroying or publishing commands (push, hard reset, forced clean, branch force-delete, discarding the working tree). Treat that prompt as the authorization check, and take those actions only when the user's request or the project workflow calls for them.

- Commit when requested or when the project workflow authorizes it; implementation alone does not imply a commit. A user-typed `/implement` or `/implement-spec` authorizes the commits those skills make.
- Stage only the task's own changes and leave pre-existing and concurrent work intact.
- Make small, ordered commits that each land green; in a bug fix, the failing test lands before the fix.
- In a JavaScript or TypeScript project with no pre-commit hook, offer `setup-pre-commit` before the first commit.
