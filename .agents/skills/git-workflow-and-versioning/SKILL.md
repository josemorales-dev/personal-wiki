---
name: git-workflow-and-versioning
description: Plan commits, branches, releases, and versioning when the task requires Git changes.
---

Read [skill resource and project path rules](../PATHS.md) before applying this skill.

# Git workflow and versioning

Use `agents-workflow` as the authority for authorization and Git actions. Inspect the current branch, status, and diff before changing Git state. Follow the project's branching and release conventions; do not impose a branching model on an established repository.

When commits are authorized, make each commit one coherent change with a message explaining its purpose. Inspect the staged diff and include only task changes. Preserve unrelated modifications and avoid broad staging. Verify each meaningful increment with appropriate checks; verification does not itself authorize committing.

For releases, inspect the public API change and the project's versioning policy before selecting a version bump. Include compatibility changes in the changelog. Tagging, publishing, pushing, and merging follow the user's authorization and project workflow.

For parallel work, prefer an isolated checkout or worktree when appropriate. Preserve concurrent work when resolving conflicts or cleaning up; do not reset the checkout as an automatic recovery step.
