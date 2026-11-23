---
name: agents-language-standards
description: Routes programming-language work to the project's mandatory language-specific standards. Use when reading, writing, reviewing, testing, or configuring TypeScript, TSX, JavaScript checked by TypeScript, declaration files, tsconfig, or typed ESLint rules.
---

Read [skill resource and project path rules](../PATHS.md) before applying this skill.

# Programming language standards

Identify every programming language touched by the task. Read each matching reference completely before inspecting or changing that language's code or configuration.

| Read this file                       | When the task involves                                                                                                                                          |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `references/TYPESCRIPT_STANDARDS.md` | `.ts`, `.tsx`, `.mts`, `.cts`, `.d.ts`, TypeScript-checked JavaScript, `tsconfig`, TypeScript ESLint rules, package type declarations, or TypeScript type tests |

For example, editing an endpoint or Zod schema requires the TypeScript reference here and project architecture from a relevant project-local guide; changing `tsconfig.json` also requires `agents-workflow` when files will change.

## Rules

- Read every matching reference; do not work from this router or memory.
- Use `agents-code-standards` as well for code changes or reviews; its technology-independent standards remain mandatory.
- Use `agents-workflow` for scope, authorization, working state, and Git actions; follow applicable project instructions.
- Use `agents-project-guides` as well when a framework, platform, domain, or architecture trigger matches.
- Follow the narrower repository or domain rule when a general language recommendation conflicts with an established project constraint, and surface the mismatch.
- Apply toolchain recommendations only when the task touches that toolchain or creates a new configuration. Do not expand a code edit into an unrequested compiler or lint migration.
- Consult official release notes when behavior depends on the installed TypeScript version or the task changes that version.
- Never invent guidance for a language without a reference document.
