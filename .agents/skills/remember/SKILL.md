---
name: remember
description: Curates durable project memory by extracting current facts, decisions, constraints, and reusable context while archiving stale or redundant artifacts. Use when the user says remember or forget, asks to save or audit project memory, or when agents-workflow reaches completed-session cleanup.
---

Read [skill resource and project path rules](../PATHS.md) before applying this skill.

# Remember

Keep the smallest set of verified knowledge that helps future work understand
the project's current domain and context. Treat memory as maintained state, not
as task history.

## Retention test

Keep information in active memory only when all are true:

- It is verified and still current.
- It will materially affect future work.
- It is not already captured in an authoritative file.
- Its value exceeds the cost of rediscovering it from the codebase.
- It has a clear destination and can be maintained there.

Otherwise do not promote it into active memory. Archive source artifacts when
the rules below require retention.

## Choose the destination

- Update `.agents/docs/PROJECT_CONTEXT.md`
  for current domain language, architecture, commands, invariants, and public
  contracts.
- Create or supersede an ADR under `.agents/docs/adr/` for durable decisions and
  rationale. Do not delete ADR history merely because a decision changed.
- Keep `.agents/MEMORY.md` as a concise index of supplemental current memories.
- Create `.agents/memories/<topic>.md` only for focused cross-session knowledge
  too detailed for the index and inappropriate for project context or an ADR;
  link it from `MEMORY.md`.
- Keep future work in an active plan or configured issue, not in memory.
- Do not promote completed plans, scratch diffs, logs, validation output,
  duplicated summaries, stale facts, or cheaply rediscoverable implementation
  detail into active memory. Archive completed session artifacts instead.

## Curate

1. Read the relevant code, project context, ADRs, memory index, topic memories,
   and active session artifacts. Read archived artifacts only when the user
   requests recovery or current sources are insufficient.
2. Verify candidate facts against current code and authoritative docs.
3. Update the existing authoritative destination instead of copying the same
   fact into multiple files.
4. Rewrite stale supplemental memory when part remains current. When the whole
   topic is retired, unlink it from `MEMORY.md` and move the file to
   `.agents/archive/memories/`. Preserve ADR history through status or
   supersession links.
5. During approved workflow cleanup, move the completed session directory to
   `.agents/archive/sessions/<session-id>/` after extracting anything that
   passes the retention test. Do not treat archived session files as memory.
6. Report what was kept, updated, superseded, and archived.

## Safety

- Follow the selected project’s existing memory layout and `agents-workflow` for authorization. Keep state in that project; memory curation does not waive applicable project instructions.
- Never store secrets, credentials, private personal data, or transient tool
  state in project memory.
- Never delete session or memory artifacts during curation. Archive retired
  artifacts under `.agents/archive/`.
- Never archive an active session or another agent's files.
