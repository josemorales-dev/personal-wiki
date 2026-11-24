---
name: agents-coding-workflow
description: Software workflow for coding tasks in a code repository: scope, sessions, Git, and issues. Use when writing or changing code, taking Git actions, or working an issue or PRD.
---

Read [skill resource and project path rules](../PATHS.md) and the selected project's local instructions before applying this skill.

# Coding workflow

This is the workflow for writing software: code changes in a repository and the issues and PRDs that drive them. Notes, documents, spreadsheets, and skill writing follow their own skills. Apply `agents-code-standards`, plus `agents-language-standards` where the language matches, to every change.

## The loop

Take the route from **Planning** in the hub `AGENTS.md`. Each step ends on its completion criterion. Move to the next step only once it holds.

1. **Align.** For ambiguous, cross-module, or multi-step work, grill the user: load `grilling` and `domain-modeling`, or ask the user to type `/grill-with-docs` (or `/to-spec` when a spec is wanted). Done when the goal, the seams under test, and the checks are agreed and written in `PLAN.md`.
2. **Research.** When the code the goal touches is unfamiliar, dispatch an `Explore` subagent with the goal and ask for the files, flows, and constraints involved as `path:line` pointers. Write its findings to `RESEARCH.md` in the session folder. Read in full only the files you will change. Done when every path in the plan's `Scope` traces to a finding.
3. **Approve.** Run `sessions check-format <id>` and fix what it reports. Present `PLAN.md`, `SCRATCH-TESTS.md`, and `SCRATCH-CODE.md` together, and write code only after the user approves them. Ask for approval as its own yes-or-no question that names the session and the files it covers, and put any other decision in a separate question. Only a yes to that question is approval. Done when the user approves all three.
4. **Route.** A bug or regression goes to `diagnosing-bugs`; new or changed behaviour goes to `tdd`; a question about module shape or seam placement goes to `codebase-design`.
5. **Build in verifiable units.** Each unit is red → green → refactor: a failing check, the smallest change that turns it green, then cleanup with the check still green. Refactor inside each unit, before the next red, even where `tdd` places refactoring at review. Done when every unit in `Scope` is green; start the next unit only from a green state.
6. **Prove it works.** Run the plan's `Checks` this turn against the real artifact: typecheck and single test files during the work, the full suite once at the end. Quote each check's summary line and every failure, not the full log; pipe long output through `tail` or the runner's quiet reporter. A bug fix shows the reproduction failing before the fix and passing after. Done when every check has quoted output from this turn; "it compiles" and earlier runs are proxies, not proof.
7. **Review.** For a code change, run `code-review` against the spec and standards. For a change to instructions or docs only, such as a skill, `AGENTS.md`, or a format reference, review the diff yourself against `writing-for-agents` and unslop. When the change touches shared code, name what else could break and the fact that makes it safe. Done when every finding is fixed or reported as a known limitation.
8. **Spot-check.** Pick the 2–3 places in the diff most worth human eyes, each as `path:line` with the risk it carries and the check that covers it. Done when the list is in the final report.
9. **Ship.** Commit or open a PR only when authorized (see Git). Report the result, the spot-check list, remaining limitations, and changed paths.
10. **Learn.** When a mistake recurred, or review or a check let one through, suggest the user run `/retro`; a mechanical mistake becomes a lint rule, test, or hook. Done when the suggestion is made, or no mistake recurred.

## Writing

Every artifact the user reads follows the rules in [unslop](../unslop/SKILL.md): `PLAN.md`, the scratch files, `RESEARCH.md`, the final report, commit messages, PR bodies, and issues. Read the rules before writing the first artifact of a task, and check each artifact against them before presenting it. Verbatim content stays exact: proposed code and diffs, command output, and quotes.

## Authorization and scope

Carry out changes the user has authorized. An audit or review alone authorizes inspection and findings; an explicit request to fix or implement authorizes the scoped edits. Ask only for missing information, genuinely consequential approval, or a specific applicable project requirement.

Sessions for every project live in the hub, so one list shows every agent's work on this machine. Manage them with the `sessions` command; `sessions help` lists its commands. When `sessions` is not found, run `bun run link` in the hub's `.agents/tools/sessions/` to put it on `PATH`.

- Check: run `sessions list` before starting. When another session's scope overlaps the new work, tell the user before building.
- Start: run `sessions start <id> --repo <project> --tool <claude|codex>` before writing `PLAN.md`. It creates the worktree `<project>.worktrees/<id>` on branch `<id>` and the session folder `.agents/sessions/<id>/` in the hub. Write `PLAN.md`, the scratch files, and `RESEARCH.md` in the folder, and make every change and commit in the worktree. When the project has uncommitted changes, `start` copies them into the worktree, uncommitted. Stage only the session's own changes, and before merging, commit or stash the project's copy of any file the session also changed.
- Track: record each step with `sessions update <id> --status <status>`, and record the approved plan's `Scope` paths with `--scope`.
- Finish: after the branch is merged, run `sessions finish <id>`. It removes the worktree and branch and archives the folder.

Read the formats before writing them:

- [references/PLAN-FORMAT.md](references/PLAN-FORMAT.md): session plans and handoff.
- [references/SCRATCH-FORMAT.md](references/SCRATCH-FORMAT.md): the exact test and code changes, approved together with the plan.

Resuming a session: `sessions show <id>` gives its worktree and folder. Its `PLAN.md`, scratch files, and Git history are the authoritative trail. Reconstruct state from them, continue from the handoff's `Next`, and re-run only the checks the remaining work touches.

## Project state

Use existing project conventions for documentation, memory, issues, and ADRs. If adopting the `.agents/` convention, project context goes in `.agents/docs/PROJECT_CONTEXT.md` and supplemental memory in `.agents/MEMORY.md` and `.agents/memories/`. Read only relevant current memory. Before `sessions finish`, move durable facts from the session into project memory or docs. An absent file does not require copying global or unrelated project state.

For issue or PRD work, read [references/issue-tracker.md](references/issue-tracker.md).

## Git

A guard (`.claude/hooks/guard-git.sh` for Claude Code, `.codex/rules/git-guardrails.rules` for Codex) asks the user before history-destroying or publishing commands (push, hard reset, forced clean, branch force-delete, discarding the working tree). Treat that prompt as the authorization check, and take those actions only when the user's request or the project workflow calls for them.

- Commit when requested or when the project workflow authorizes it; implementation alone does not imply a commit. A user-typed `/implement` or `/implement-spec` authorizes the commits those skills make.
- Stage only the task's own changes and leave pre-existing and concurrent work intact.
- Make small, ordered commits that each land green; in a bug fix, the failing test lands before the fix.
- In a JavaScript or TypeScript project with no pre-commit hook, offer `setup-pre-commit` before the first commit.
