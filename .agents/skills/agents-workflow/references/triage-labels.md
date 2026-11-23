# Triage Labels

The skills speak in terms of five canonical triage roles. Because issues are
tracked as **local markdown** (not GitHub labels), each role is recorded as the
`Status:` line near the top of an issue file under `.agents/issues/`.

| Role in skills    | String in our issue files | Meaning                                  |
| ----------------- | ------------------------- | ---------------------------------------- |
| `needs-triage`    | `needs-triage`            | Maintainer needs to evaluate this issue  |
| `needs-info`      | `needs-info`              | Waiting on reporter for more information |
| `ready-for-agent` | `ready-for-agent`         | Fully specified, ready for an AFK agent  |
| `ready-for-human` | `ready-for-human`         | Requires human implementation            |
| `wontfix`         | `wontfix`                 | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), set the
issue file's `Status:` line to the corresponding string from this table.

Edit the right-hand column to match whatever vocabulary you actually use.
