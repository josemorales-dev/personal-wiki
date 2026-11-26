# TypeScript toolchain

Mandatory rules for TypeScript compiler configuration and typed linting. Apply them only when the task changes that toolchain or creates a new configuration; keep an unrelated edit from growing into a migration. The code rules stay in `TYPESCRIPT_STANDARDS.md`.

## Compiler configuration

- Keep `strict: true`. Never weaken strictness or suppress diagnostics to make a local change pass.
- Set `target` to the oldest runtime actually supported, not an older default. Set `lib` to APIs that are truly available through the runtime or explicit polyfills.
- Select module settings from the official environment guide. Apps should model their known runtime or bundler; libraries should check with strict settings against their lowest supported runtime and emit declarations from a dedicated build configuration.
- For new strict configurations, enable `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride`, and `noUncheckedSideEffectImports` unless a documented environment or migration constraint prevents one.
- Scope `include`, `exclude`, and project references deliberately. Remember that `exclude` does not prevent an imported file from entering the program.
- Keep type checking separate from transpilation when the runtime or bundler strips types. A successful emit or execution is not proof that `tsc` passed.
- Treat compiler-option migrations as planned compatibility changes. Measure the errors, fix root causes in small slices, and do not hide them with broad exclusions.

## Typed linting

- Use typescript-eslint type-aware linting for TypeScript projects when lint configuration is in scope. Start with `recommendedTypeChecked`; evaluate `strictTypeChecked` for new or already-strict codebases.
- Enable or preserve the `no-unsafe-*` protections for assignment, arguments, calls, member access, returns, and narrowing assertions. They prevent `any` from silently crossing trusted code.
- Enable or preserve `no-non-null-assertion`, `no-unnecessary-type-assertion`, `no-unnecessary-type-parameters`, `no-floating-promises`, `switch-exhaustiveness-check`, and `no-unnecessary-condition`.
- Prefer project-service typed lint configuration where supported. Account for its performance cost and ensure every linted TypeScript file belongs to the intended project.
- Fix the code or boundary rather than disabling a rule globally. A narrow suppression requires a concrete reason and must not conceal unsafe input.
