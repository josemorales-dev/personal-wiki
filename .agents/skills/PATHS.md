# Skill resources and project paths

Resolve bundled references, scripts, and assets relative to the directory containing the loaded skill's SKILL.md. Resolve symlinks to find that directory. Loading a skill does not change the working directory. To use another skill's resource, locate that skill through discovery and resolve the resource from its directory.

Resolve project files, commands, and outputs from the selected project root. Use the user's explicit project path first; otherwise use the active workspace. Within a Git checkout, determine the root with `git -C <workspace> rev-parse --show-toplevel`. Preserve an explicitly selected subproject in a monorepo. For a non-Git project, use its explicitly selected directory.

If no project is selected, target the hub repository that holds these skills and its own configuration. For code or notes work outside the hub with no named location, ask which repository or folder to target before reads or writes. Do not infer a project from a skill's installation directory, an ancestor home directory, or copied examples. Running commands from a nested directory requires setting their working directory to the selected project root.

Paths such as `.agents/issues/`, `.agents/docs/`, `src/`, `tests/`, and `docs/adr/` refer to the selected project, never to the hub's skill collection unless the hub itself is the selected project. Keep project memory, issues, and context in that project. Session state is the exception: it lives in the hub's `.agents/sessions/`, managed by the `sessions` tool from `agents-coding-workflow`. Create missing working-state files only when the task needs them; an absent project guide is not permission to substitute another project's guide.

Read the selected project's AGENTS.md / CLAUDE.md and applicable local instructions. Project-specific guidance takes precedence over generic skill recommendations, subject to higher-priority instructions and the user's authorization. Skills do not independently authorize publishing, messaging, deployments, destructive operations, or unrelated edits.
