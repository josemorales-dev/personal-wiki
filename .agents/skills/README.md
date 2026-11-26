# Agent skills

Canonical skills for this hub. Codex discovers them in `.agents/skills/`; Claude discovers the relative links in `.claude/skills/`. Nothing is installed globally, so agents find them when started from the hub. For work in another repository, name its path; with Claude Code, also pass `--add-dir <path>`. Read [PATHS.md](PATHS.md) for resource and project resolution. Working state stays in the selected project.

## Adding a skill

1. Place it in `.agents/skills/<name>/`.
2. Link `.claude/skills/<name>` to `../../.agents/skills/<name>` with a relative symlink.
3. Write it with `writing-for-agents`.

Skills listed in `skills-lock.json` come from upstream. After each upstream update, check that local edits to them still hold.
