# Project issue tracker

Use the selected project's configured tracker and instructions (in a project set up with `setup-matt-pocock-skills`, `docs/agents/issue-tracker.md` and `docs/agents/triage-labels.md`). Infer hosted repository identity from that project's Git remotes, never from the hub where the skills are installed; clarify ambiguous repositories before querying. Read referenced issues when authorized by the task. Creating or updating hosted issues, comments, or pull requests requires user authorization or an explicitly invoked workflow that authorizes it; skills do not grant that permission themselves.

## Local fallback

When the project configures no tracker, use local Markdown under the selected project's `.agents/issues/`. A feature may have `PRD.md`, `MAP.md`, `issues/<NN>-<slug>.md`, and `research/<slug>.md`. Record issue state with `Type:`, `Status:`, `Resolution:`, `Claimed by:`, and `Blocked by:` lines near the top of the file. `Status:` takes one of the canonical triage roles: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Existing tracker conventions take precedence over this layout.

For wayfinding, claim a child before starting, resolve its blockers before work, and record the answer and sources before marking it resolved. Link durable findings from the map. Keep long research under `research/`.
