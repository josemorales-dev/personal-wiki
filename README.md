# personal-wiki

Centralized hub for aggregating knowledge and doing agentic work on this computer:
code, Obsidian notes, documents, and spreadsheets.

- `AGENTS.md` — agent instructions (`CLAUDE.md` imports it)
- `.agents/skills/` — agent skills; `.claude/skills/` links to them
- `.agents/docs/` — conventions agents read on demand
- `knowledge/` — distilled knowledge
- `templates/` — reusable starting files

Start an agent from this directory (`claude` or `codex`). To work on another
repository, name its path, e.g. `claude --add-dir ~/Projects/<name>`.
