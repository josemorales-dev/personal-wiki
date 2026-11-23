# Engineering Standards

Mandatory decision rules for planning, implementation, refactoring, naming, and module design. Not suggestions.

## Core Directive

Implement the smallest correct change that solves the requirement while reducing complexity, preserving clarity, and keeping responsibilities well-bounded. Do not expand scope, add speculative abstractions, or reorganize unrelated code.

## Project Standards

Consult the relevant file when work touches these domains:

- `.agents/docs/PROJECT_CONTEXT.md` — project architecture, contracts, commands, and terminology (when this file exists)
- [agents-language-standards/SKILL.md](../../agents-language-standards/SKILL.md) — TypeScript, JavaScript, declaration, compiler, and typed-lint routing

## Rules

### 1) Minimal Scope Change

- Change only files, functions, types, and lines required for the goal.
- No opportunistic refactors unless required for correctness or to eliminate a red flag blocking a clean solution.
- Keep diffs tight and reviewable.
- Preserve behavior unless the task requires behavior change; avoid mixing unrelated cleanup into the same change.
- Before every edit, ask: what is the smallest change that fully solves the requirement?

### 2) Code Is a Liability

- Prefer less code. Every new type, function, abstraction, or dependency must justify its existence.
- Do not create helpers, wrappers, or interfaces unless they reduce caller complexity or enforce a meaningful boundary.

### 3) KISS

- Straightforward over clever. One obvious path over configurable paths.
- No premature generalization. No indirection without cognitive load reduction.

### 4) Intention-Revealing Names

- Names should communicate purpose without surrounding context; wider scope needs more descriptive names.
- Use domain terminology. Avoid `data`, `value`, `item`, `util`, `helper`, `manager`, `service`, `misc`, and `temp`.
- Prefer responsibility or invariant names over implementation names.

### 5) Zero Comment Clutter

- Prefer self-documenting code through naming, types, and structure.
- No obvious comments, redundant docstrings, commented-out code, or TODO/FIXME.
- Use comments only for non-obvious intent, complex algorithms, or constraints not expressible in code.
- Preserve existing comments unless the task requires editing them.

### 6) Parse, Don't Validate

- Enforce constraints at system boundaries such as HTTP, CLI, config, DB, and external APIs.
- Convert untrusted input into trusted domain types as early as possible so invalid states become unrepresentable.
- Downstream code should operate on domain values, not loosely typed raw input.
- Fail early at boundaries with precise errors instead of spreading defensive checks through the call graph.

### 7) SOLID (DIP Primary)

- Use SOLID pragmatically, not ceremonially.
- High-level policy must not depend on low-level details; push framework, I/O, persistence, and vendor code to the edges.
- Prefer composition over inheritance.
- Keep public interfaces smaller and more stable than implementations. Inject capabilities at seams.

### 8) Vertical Slicing

- Organize by feature or responsibility, not by technical layer alone.
- Keep related behavior, types, policies, and tests together.
- Avoid layers that only forward data without adding abstraction.
- A folder should help a reader predict where behavior lives.

## Module Design

- Prefer deep modules: simple interfaces with meaningful hidden complexity.
- Hide internals. Do not leak ordering, flags, storage, or framework mechanics.
- Pull complexity downward into the module best positioned to own it.
- Define errors out through types, constrained constructors, and narrow interfaces.
- Every layer must add an abstraction; avoid pass-through layers and wrapper APIs that do not reduce surface area or enforce domain language.

Red flags requiring redesign: shallow modules, information leakage, pass-through methods, callers depending on internal knowledge, duplicated logic, temporal decomposition.
