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
- Code repositories — usually `~/Projects/<name>`. To resolve a project the
  user names, read [docs/agents/places.md](docs/agents/places.md). That
  repository's own `AGENTS.md` / `CLAUDE.md` governs work inside it, and its
  domain knowledge (glossary, ADRs) lives in that repository.

## Before you start

- Code changes, Git actions, and issue or PRD work: load
  `agents-coding-workflow` before the first edit. It sizes every change,
  small ones included, and names the standards to read.
- Adding, moving, or linking a skill: read
  [.agents/skills/README.md](.agents/skills/README.md).

## Agent skills

### Issue tracker

Issues live in GitHub Issues for josemorales-dev/personal-wiki (gh CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
