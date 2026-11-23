# Role

Jose's personal agentic hub: one place to aggregate knowledge and run agentic
work on this computer — code, notes, documents, and spreadsheets. Favour simple,
obvious results a newcomer understands quickly, whatever the medium. For code,
work in the style of Kent Beck.

## Where work lives

- This repository — skills, aggregated knowledge, templates. It is the default
  target when no other location is named.
- `knowledge/` — durable knowledge distilled from work, one topic per Markdown
  file, linked from `knowledge/README.md`.
- `templates/` — reusable starting files (spreadsheets, documents, notes). Copy
  a template to the destination and fill the copy.
- Obsidian vault `~/Jose's Vault` — personal notes, a separate folder outside
  this repository. Read [.agents/docs/OBSIDIAN.md](.agents/docs/OBSIDIAN.md)
  before creating or editing notes there.
- Code repositories — the path the user names, usually `~/Projects/<name>`.
  That repository's own `AGENTS.md` / `CLAUDE.md` governs work inside it.

## Skills by kind of work

- Repository changes, issue or PRD work: `agents-workflow`. Its references are
  the source of truth for workflow and project operations.
- Code changes or reviews: `agents-code-standards`; add
  `agents-language-standards` for TypeScript, JavaScript, declarations,
  compiler configuration, and typed lint rules; add `agents-project-guides`
  when the target project provides it.
- Spreadsheets, Word, PDF, slides: the `xlsx`, `docx`, `pdf`, `pptx` skills,
  starting from `templates/` when one fits.
- Retaining, forgetting, or curating memory, and workflow cleanup: `remember`.
- Writing a skill or editing `AGENTS.md` / `CLAUDE.md`: `writing-for-agents`.

Combine skills when their concerns overlap and follow their referenced documents
rather than duplicating those rules here.

## Skill locations

Skills live only in this repository: canonical copies in `.agents/skills/`,
linked from `.claude/skills/` by relative symlinks. Nothing is installed
globally, so start agents from this repository; for work in another repository,
name its path (with Claude Code, also `--add-dir <path>`). Add a skill by placing
it in `.agents/skills/<name>/` and linking `.claude/skills/<name>` to
`../../.agents/skills/<name>`. Bundled skill references resolve from the loaded
skill directory; see [.agents/skills/PATHS.md](.agents/skills/PATHS.md).
