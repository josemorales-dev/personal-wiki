# Role

Jose's personal agentic hub: one place to run agentic work on this computer —
code, notes, documents, and spreadsheets. Favour simple,
obvious results a newcomer understands quickly, whatever the medium. For code,
work in the style of Kent Beck.

## Where work lives

- This repository — skills and agent configuration. It is the default target
  when no other location is named.
- Obsidian vault `~/Jose's Vault` — all personal notes and durable knowledge, a
  separate folder outside this repository.
- Code repositories — the path the user names, usually `~/Projects/<name>`.
  That repository's own `AGENTS.md` / `CLAUDE.md` governs work inside it, and
  its domain knowledge (glossary, ADRs) lives in that repository.

## Skills by kind of work

- Writing software (code changes, Git actions, issue or PRD work):
  `agents-coding-workflow`. Its references are the source of truth for
  workflow and project operations.
- Code changes or reviews: `agents-code-standards`; add
  `agents-language-standards` for TypeScript, JavaScript, declarations,
  compiler configuration, and typed lint rules; add `agents-project-guides`
  when the target project provides it.
- Notes in the Obsidian vault, personal or NYC DSA (capture, tasks, meetings,
  projects, weekly review): `agents-obsidian-workflow`.
- Spreadsheets, Word, PDF, slides: the `xlsx`, `docx`, `pdf`, `pptx` skills.
- Writing a skill or editing `AGENTS.md` / `CLAUDE.md`: `writing-for-agents`.

Combine skills when their concerns overlap and follow their referenced documents
rather than duplicating those rules here.

## Planning

Every coding change goes through a session run by `agents-coding-workflow`:
`PLAN.md`, `SCRATCH-TESTS.md`, and `SCRATCH-CODE.md`, approved together before
any code is written. The one exception is a small, clear change, which aligns in
one line of the reply. The rule holds on every route, including tickets built
with `/implement` or `/implement-spec`.

| Size                   | Route                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Small, clear change    | Align in one line of the reply; no session.                                                                                |
| Fits one session       | One session.                                                                                                               |
| Spans several sessions | `/grill-with-docs` → `/to-spec` → `/to-tickets`; each ticket is one session, built with `/implement` or `/implement-spec`. |
| Too foggy to spec      | `/wayfinder` until the destination is a spec, then the row above.                                                          |

Slash commands are user-typed: name the command and ask the user to run it.

## Skill locations

Skills live only in this repository: canonical copies in `.agents/skills/`,
linked from `.claude/skills/` by relative symlinks. Nothing is installed
globally, so start agents from this repository; for work in another repository,
name its path (with Claude Code, also `--add-dir <path>`). Add a skill by placing
it in `.agents/skills/<name>/` and linking `.claude/skills/<name>` to
`../../.agents/skills/<name>`. Bundled skill references resolve from the loaded
skill directory; see [.agents/skills/PATHS.md](.agents/skills/PATHS.md).

## Agent skills

### Issue tracker

Issues live in GitHub Issues for josemorales-dev/personal-wiki (gh CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
