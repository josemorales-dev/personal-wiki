# Slim agent context

## Task 1: Load only what each route needs

- Status: in progress
- Goal: `AGENTS.md` keeps only what every session needs, and the coding and TypeScript instructions load their session and toolchain parts only on the routes that use them.

Notes:

- The Figma plugin was disabled in `~/.claude/settings.json` outside this session, at the user's request.
- Upstream skills in `skills-lock.json` stay unchanged.
- The `## Agent skills` block in `AGENTS.md` stays, because the upstream skills expect it in context.
- The coding guardrail stays in `AGENTS.md` as one line, because it must fire before any skill loads.
- Known limitation: notes, documents, and skill writing now reach their skills through the skill descriptions alone, since `AGENTS.md` no longer lists them.
- Known limitation: `agents-coding-workflow/SKILL.md` shrinks only from 11.2 KB to 10.5 KB, because it gains the Routes section. The saving on every session is the 2.9 KB cut from `AGENTS.md`.

Scope:

| Path                                                                       | Change                                                                                                    |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                                                                | Drop Planning, Skill locations, and the skill list that repeats descriptions; keep one coding guardrail line. |
| `.agents/skills/README.md`                                                 | Take the Skill locations rules.                                                                           |
| `.agents/skills/agents-coding-workflow/SKILL.md`                           | Take the Planning rules as a Routes section; move session mechanics out.                                  |
| `.agents/skills/agents-coding-workflow/references/SESSIONS.md`             | New: the `sessions` commands, start, track, finish, and resume.                                           |
| `.agents/skills/agents-language-standards/SKILL.md`                        | Add a routing row for the toolchain reference.                                                            |
| `.agents/skills/agents-language-standards/references/TYPESCRIPT_STANDARDS.md` | Move compiler configuration, typed linting, and sources out.                                              |
| `.agents/skills/agents-language-standards/references/TYPESCRIPT_TOOLCHAIN.md` | New: compiler configuration and typed linting.                                                            |
| `.agents/skills/agents-language-standards/references/TYPESCRIPT_SOURCES.md`   | New: the sources list.                                                                                    |

Steps:

1. Draft each path in the worktree.
2. Review the draft against `writing-for-agents` and unslop.

Checks:

- `wc -c AGENTS.md` shows under 2000 bytes.
- `grep -rn "Planning" AGENTS.md .agents/skills --include=*.md` finds no pointer to an `AGENTS.md` Planning section.
- `grep -c "^## Compiler configuration\|^## Typed linting\|^## Sources" .agents/skills/agents-language-standards/references/TYPESCRIPT_STANDARDS.md` shows 0.
- Every relative Markdown link in the changed files resolves to an existing file.
- Every rule removed from one file appears in its new home: a diff of the sorted bullet lines across old and new files shows no lost line.
