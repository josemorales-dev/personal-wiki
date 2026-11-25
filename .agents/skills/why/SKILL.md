---
name: why
description: Find the recorded reason behind code from commits, pull requests, and issues. Use when asking why code works a certain way or why a choice was made, tracing a regression's origin, or checking a comment's claim.
---

# Why

Answer from the record, not the code. Trace the target's history with `git log -L` or `git log --follow`, read each commit that introduced or changed it, and read the pull request and issue behind each commit (`gh pr list --search <sha> --state all`, `gh pr view <n> --comments`). Widen to linked issues, ADRs, and docs when the trail is thin.

Cite what the authors wrote, with commit SHAs and pull request numbers. Mark your own inferences as inferences, and say what the record does not answer.
