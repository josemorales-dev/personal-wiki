# Engineering Standards

Mandatory decision rules for planning, implementation, refactoring, naming, and module design. Not suggestions.

## Core Directive

Implement the smallest correct change that solves the requirement while reducing complexity, preserving clarity, and keeping responsibilities well-bounded. Keep scope to the requirement, abstractions to what today's callers need, and structure changes to the code the requirement touches.

## Project Standards

Consult the relevant file when work touches these domains:

- `.agents/docs/PROJECT_CONTEXT.md` — project architecture, contracts, commands, and terminology (when this file exists)
- [agents-language-standards/SKILL.md](../../agents-language-standards/SKILL.md) — TypeScript, JavaScript, declaration, compiler, and typed-lint routing

## Rules

### 1) Minimal Scope Change

- Change only files, functions, types, and lines required for the goal.
- Refactor only where correctness requires it or a red flag blocks a clean solution.
- Keep diffs tight and reviewable; each change carries one concern.
- Preserve behavior unless the task requires behavior change.
- Before every edit, ask: what is the smallest change that fully solves the requirement?

### 2) Code Is a Liability

- Prefer less code. Every new type, function, abstraction, or dependency must justify its existence.
- Add a helper, wrapper, or interface only when it reduces caller complexity or enforces a meaningful boundary.

### 3) Subtract Before You Add

- Before adding, remove the dead code, unused options, and obsolete paths in the area you touch, then build on the simpler base.
- Sequence the subtraction as its own green unit ahead of the addition.

### 4) KISS

- Straightforward over clever. One obvious path over configurable paths.
- Generalize when the second real caller arrives. Add indirection only when it lowers cognitive load.

### 5) Intention-Revealing Names

- Names should communicate purpose without surrounding context; wider scope needs more descriptive names.
- Use domain terminology from the project's glossary. Name the responsibility or invariant; generic words such as `data`, `value`, `item`, `util`, `helper`, `manager`, `service`, `misc`, and `temp` name nothing.

### 6) Self-Documenting Code

- Carry intent in naming, types, and structure.
- Write no comments; put surprising behavior into names, types, and structure instead. Delete commented-out code and track follow-up work in the issue tracker. The keep exceptions:
  - legal or license headers;
  - non-obvious behavior forced by an external dependency, platform, vendor, or protocol we cannot change;
  - formatter directives such as `// prettier-ignore`, and lint suppressions whose rule is faulty, pedantic, or style-only;
  - doc comments that define a public API contract;
  - issue or RFC links that explain a constraint the code cannot express.
- Preserve existing comments unless the task requires editing them.

### 7) Parse, Don't Validate

- Enforce constraints at system boundaries such as HTTP, CLI, config, DB, and external APIs.
- Convert untrusted input into trusted domain types as early as possible so invalid states become unrepresentable.
- Downstream code should operate on domain values, trusting the types the boundary produced.
- Fail early at boundaries with precise errors.

### 8) Fix Root Causes

- Reproduce first, then trace the symptom back to the first place the system did something it should not.
- Ask whether the state that triggered the symptom is legitimate. If it is, handle it where the code broke. If it should never exist, fix what produced it: a guard, retry, swallowed error, or clamped value at the symptom hides the bug.
- Fix the pattern, not the instance: find every place with the same fault.

### 9) Test Behavior, Not Implementation

- Tests observe behavior through public interfaces at agreed seams, so they fail when behavior breaks and pass through refactors. The `tdd` skill holds the details.

### 10) SOLID (DIP Primary)

- Use SOLID pragmatically, not ceremonially.
- High-level policy depends on abstractions; push framework, I/O, persistence, and vendor code to the edges.
- Prefer composition over inheritance.
- Keep public interfaces smaller and more stable than implementations. Inject capabilities at seams.

### 11) Vertical Slicing

- Organize by feature or responsibility, not by technical layer alone.
- Keep related behavior, types, policies, and tests together.
- Every layer adds an abstraction.
- A folder should help a reader predict where behavior lives.

### 12) Migrate Callers, Then Delete

- When a new internal API replaces an old one, migrate every caller and delete the old API in the same change. One API per job is the end state; compatibility shims exist only for external consumers.

## Module Design

- Prefer deep modules: simple interfaces with meaningful hidden complexity.
- Hide internals: ordering, flags, storage, and framework mechanics stay inside the module.
- Pull complexity downward into the module best positioned to own it.
- Define errors out through types, constrained constructors, and narrow interfaces.
- Each layer and wrapper earns its place by reducing surface area or enforcing domain language.

Red flags requiring redesign: shallow modules, information leakage, pass-through methods, callers depending on internal knowledge, duplicated logic, temporal decomposition.
