# Project issue tracker

Use the selected project's configured tracker and instructions. Infer hosted repository identity from that project's Git remotes, never from the hub where the skills are installed. Read referenced issues when authorized by the task. Creating or updating hosted issues, comments, or pull requests requires user authorization or an explicitly invoked workflow that authorizes it; skills do not grant that permission themselves.

If no tracker is configured, use local Markdown under the selected project's `.agents/issues/`. A feature may have `PRD.md`, `MAP.md`, `issues/<NN>-<slug>.md`, and `research/<slug>.md`. Record local issue state with `Type:`, `Status:`, `Resolution:`, `Claimed by:`, and `Blocked by:` as needed. Use [triage-labels.md](triage-labels.md) for fallback state names. Read local paths directly. For a hosted issue number, use the selected project's remote; clarify ambiguous repositories before querying.

For wayfinding, claim a child before starting, resolve its blockers before work, and record the answer and sources before marking it resolved. Link durable findings from the map. Keep long research under `research/`. Existing tracker conventions take precedence over this fallback layout.
