# Review the draft before approval

## Task 1: Move the review from after the build to the draft

- Status: in progress
- Goal: `agents-coding-workflow` reviews the session draft before the user is asked to approve it, and step 8 only confirms that main matches the approved draft.

Notes:

- Decisions settled with the user on 2026-11-25:
  - Step 8 keeps a match check of each `Scope` path against the draft, plus a self-review of in-scope refactors made during the build. No subagents.
  - A small change has no draft. Its review is a self-review in main, with no subagents.
  - The draft review runs `code-review` from the worktree. The fixed point is the worktree's `HEAD`, the spec is `PLAN.md`, and untracked new files are listed for the subagents to read whole.
  - A change to instructions or docs only gets its `writing-for-agents` and unslop self-review at the draft too.
- The approval reply lists the review's open limitations before the approval question.
- `AGENTS.md` stays as it is. Its Planning section still holds: the draft is reviewed and approved before the build, and a small change still gets checks and a review.
- After shipping, delete the `review-before-approval` memory, because the skill then carries the rule.

Scope:

| Path                                              | Change                                                                                                     |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `.agents/skills/agents-coding-workflow/SKILL.md`  | Standards, Approval, and steps 3, 4, 6 and 8: review at the draft, list limitations, match check at step 8. |
| `.agents/skills/code-review/SKILL.md`             | Step 1: in uncommitted mode, list untracked files for the subagents.                                        |

Steps:

1. Draft both edits in the worktree.
2. Review the draft yourself against `writing-for-agents` and unslop, and fix each finding.
3. Run `sessions check-format review-before-approval`, then `sessions review review-before-approval`.

Checks:

- ``grep -n '`code-review`' .agents/skills/agents-coding-workflow/SKILL.md`` matches only step 3.
- `grep -n "ls-files --others" .agents/skills/code-review/SKILL.md` shows one match.
- `sessions check-format review-before-approval` reports no problems.
