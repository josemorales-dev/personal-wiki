# TypeScript Standards

Mandatory decision rules for TypeScript code, public types, compiler configuration, typed linting, and type tests. Apply toolchain sections only when the task changes that toolchain or creates a new configuration; do not turn an unrelated edit into a migration.

For worked Do/Don't code, read `references/TYPESCRIPT_PATTERNS.md` when a type-design, boundary, narrowing, or brand rule's code shape is unclear, or when removing an `as` or `!` from existing code.

## Runtime truth

- Treat TypeScript as static analysis over JavaScript, not a runtime type system. Types are erased, soundness is not a design goal, and annotations do not make external values safe.
- Preserve JavaScript runtime semantics. Prefer ECMAScript modules and runtime constructs over TypeScript-only namespaces, enums, or parameter properties unless an existing public contract requires them.
- Choose types that describe values the runtime can actually produce. Never use a type annotation, assertion, or generic argument as a substitute for runtime work.
- Check the installed TypeScript version and its release notes before relying on newer syntax, narrowing, library declarations, or compiler behavior.

## Type design and inference

- Prefer inference for obvious local values. Add annotations where they define a meaningful contract, especially exported APIs, callbacks with contextual types, recursive values, and intentional widening.
- Prefer annotations or `satisfies` to assertions when checking object shape. They preserve compiler checking instead of claiming the result.
- Model alternatives as discriminated unions with literal discriminants, using the discriminant name the codebase already uses (`kind`, `type`, or `tag`). Narrow from runtime evidence and handle every variant exhaustively: end a `switch` over a discriminant with `default: { const _exhaustive: never = value; }` so a new variant fails to compile.
- Design types so valid values represent valid states. Replace boolean clusters, optional-property bags, and sentinel strings or numbers with explicit variants when states have different required data.
- Model constructively: shape the type so the illegal value cannot be built, such as `[T, ...T[]]` for a non-empty list or `start` plus `duration` instead of two independent dates. Keep the simplest total type (`T[]`) while every operation on it stays total; where the loose type forces `!`, an assertion, or a "should never happen" throw, strengthen the input or weaken the result to `T | undefined`.
- Derive types from their source of truth with `typeof`, `ReturnType`, `Parameters`, `Awaited`, `Pick`, `Omit`, or a schema's inferred type before declaring a parallel interface.
- Pass an object instead of several positional parameters when arguments share a type or their order is not obvious, except on hot paths such as parsers or per-frame rendering.
- Distinguish a missing property from a property whose value is `undefined`. Make optional properties intentional and sparse.
- Use `readonly` inputs and properties when mutation is not part of the contract, particularly for shared collections and exported APIs.
- Use primitive `string`, `number`, `boolean`, `symbol`, and `bigint` types, never their boxed object types.

## Boundaries: parse, don't validate

- Accept untrusted input as `unknown` at HTTP and RPC, `JSON.parse`, environment, config, file, database, storage, `postMessage` and IPC, and third-party API boundaries.
- Parse once at the boundary into the trusted type consumed downstream. Return the parsed value; do not run a check that leaves the original broad type unchanged.
- When Zod is already in use, make the schema the runtime source of truth and infer the static type from it. Use `parse`/`parseAsync` when failure should throw and `safeParse` when failure is an expected branch.
- Parse into a named domain type. `Record<string, unknown>` and similar loose shapes stop at that parse and never travel into domain code.
- Version persisted JSON and treat a failed parse as an expected branch. Parse wire formats tolerantly of unknown fields so forward-compatible additions do not break older readers.
- Keep schemas and transformations at the boundary. Domain code must not repeatedly defend against raw input that should already have been parsed.
- A TypeScript type, type guard, assertion function, or brand is not runtime proof unless its implementation actually inspects the value.
- Before hand-writing a property-by-property type guard, use the repository's schema library and infer the type from the schema; one guard does not justify a new schema dependency. When the type is declared first, annotate the schema with it (`z.ZodType<User>`) so the compiler rejects a schema that proves less. A hand-written guard must verify every property its predicate claims, is named `isX` or `hasX`, and is the only way a brand is minted. A lying guard is worse than `as`: the bug hides behind a name that says it is safe.

## Unsafe escape hatches

- Do not introduce `any` in production code. Use `unknown`, a precise generic constraint, or a small boundary adapter. If a third-party declaration leaks `any`, contain it immediately and convert it to `unknown` or a parsed type.
- Do not narrow with `as` or postfix `!`. Narrow with the strongest evidence available, in this order: discriminant `switch`, `in`, `typeof` or `instanceof`, a verifying type guard. Use a runtime parser or code structure that makes nullability visible when none applies.
- Treat unchecked object and array lookup, inaccurate declaration files, mutable array variance, and refinements across unknown callbacks as possible unsoundness. Preserve evidence locally or re-check after mutation and opaque calls.
- Suppress a compiler error only when the underlying types cannot yet be corrected. Use the narrowest `@ts-expect-error -- reason`, keep it adjacent to the expected error, and prefer a type test. Do not add `@ts-ignore` or `@ts-nocheck`.
- Remove assertions and suppressions once they become unnecessary. Never double-assert through `unknown` merely to silence the compiler.

## Generics and nominal distinctions

- A type parameter must express a relationship between at least two positions. If it appears only once, replace it with the concrete constraint or `unknown`.
- Prefer inference over explicit type arguments. Do not expose caller-selected return types such as `parse<T>(input): T` when the implementation cannot prove `T`; accept a parser/schema or return `unknown` instead.
- Keep generic constraints at the minimum capability the implementation needs. Avoid conditional-type machinery when overloads, unions, or a concrete type are clearer.
- Use branded types only when structurally identical primitives have an important domain distinction that TypeScript must preserve. Construct them through a parsing boundary; never cast raw values directly to a brand. Match the codebase's existing brand shape, or use `string & { readonly __brand: "X" }` when none exists.
- Remember that brands are compile-time conventions, not runtime validation, and operations on branded numbers may discard the intended invariant.

## Errors and promises

- Catch thrown values as `unknown` and narrow before reading properties. Throw `Error` instances rather than arbitrary values.
- TypeScript does not encode thrown exceptions in function signatures. Use a discriminated result only when failure is an expected, caller-handled part of the contract; do not add a result abstraction around ordinary exceptional failures without a domain need.
- Every Promise must be awaited, returned, or have rejection handled. Use `void` only to mark an intentionally detached Promise whose failure is handled inside the operation.
- Preserve sequencing explicitly. Do not start asynchronous work whose completion or failure the caller implicitly depends on.

## Modules and public APIs

- Match `module` and `moduleResolution` to the actual runtime or bundler. Do not choose settings by habit or use `paths` to pretend the runtime can resolve an import it cannot.
- Use standard ESM imports and exports. Use `import type` and `export type` for type-only boundaries when required by `verbatimModuleSyntax` or file-by-file transpilation.
- Keep exported surfaces smaller than implementations. Prefer canonical named exports unless an existing package, framework, or interoperability contract requires a default export.
- Preserve stable public type names and inference behavior. A change that still runs correctly can still be a breaking declaration change.

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

## Tests and review

- Test runtime behavior at runtime. Static types do not replace boundary, error-path, or asynchronous behavior tests.
- Add compile-time tests for public overloads, generics, inference, discriminated unions, and declarations. Use the repository's existing type-test mechanism or `tsd` for a published package.
- In type tests, assert both accepted and rejected usage. Prefer exact type assertions when the exact public result matters and assignability assertions when only compatibility matters.
- Before finishing, run the repository's compiler, typed linter when configured, runtime tests, and public type tests. Inspect emitted declarations for library API changes.

## Review checklist

- [ ] External values enter as `unknown` and become trusted only through parsing.
- [ ] No new `any`, unsafe narrowing assertion, non-null assertion, or broad suppression.
- [ ] Types make invalid states impossible to construct, unions are exhaustive, and derived types come from their source.
- [ ] Every hand-written type guard verifies what it claims.
- [ ] Each generic relates types the implementation can actually guarantee.
- [ ] Every Promise and expected failure has an explicit owner.
- [ ] Runtime, module, target, and declaration assumptions match the toolchain.
- [ ] Public type behavior has compile-time coverage where runtime tests cannot observe it.

## Sources

### TypeScript

- [Handbook](https://www.typescriptlang.org/docs/handbook/)
- [TSConfig reference](https://www.typescriptlang.org/tsconfig/)
- [TypeScript design goals](https://github.com/microsoft/TypeScript/wiki/TypeScript-Design-Goals)
- [Choosing compiler options](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options)
- [Release notes](https://www.typescriptlang.org/docs/handbook/release-notes/overview)

### typescript-eslint

- [Typed linting setup](https://typescript-eslint.io/getting-started/typed-linting/)
- [Shared configurations](https://typescript-eslint.io/users/configs/)
- [Avoiding `any`](https://typescript-eslint.io/blog/avoiding-anys/)
- Unsafe flow rules: [assignment](https://typescript-eslint.io/rules/no-unsafe-assignment/), [argument](https://typescript-eslint.io/rules/no-unsafe-argument/), [call](https://typescript-eslint.io/rules/no-unsafe-call/), [member access](https://typescript-eslint.io/rules/no-unsafe-member-access/), and [return](https://typescript-eslint.io/rules/no-unsafe-return/)
- Assertion rules: [non-null](https://typescript-eslint.io/rules/no-non-null-assertion/), [unsafe type assertion](https://typescript-eslint.io/rules/no-unsafe-type-assertion/), and [unnecessary type assertion](https://typescript-eslint.io/rules/no-unnecessary-type-assertion/)
- Correctness rules: [unnecessary type parameters](https://typescript-eslint.io/rules/no-unnecessary-type-parameters/), [floating promises](https://typescript-eslint.io/rules/no-floating-promises/), [switch exhaustiveness](https://typescript-eslint.io/rules/switch-exhaustiveness-check/), and [unnecessary conditions](https://typescript-eslint.io/rules/no-unnecessary-condition/)

### Applied TypeScript guidance

- Effective TypeScript: [site](https://effectivetypescript.com/), [all posts](https://effectivetypescript.com/all-posts/), [unsoundness](https://effectivetypescript.com/2021/05/06/unsoundness/), [generics](https://effectivetypescript.com/2020/08/12/generics-golden-rule/), and [runtime types](https://effectivetypescript.com/2024/10/31/runtime-types/)
- Total TypeScript: [articles](https://www.totaltypescript.com/articles) and [unions, literals, and narrowing](https://www.totaltypescript.com/books/total-typescript-essentials/unions-literals-and-narrowing)
- Learning TypeScript: [articles](https://www.learningtypescript.com/articles), [branded types](https://www.learningtypescript.com/articles/branded-types), [comment directives](https://www.learningtypescript.com/articles/comment-directives), [why there is no `throws`](https://www.learningtypescript.com/articles/why-typescript-doesnt-include-a-throws-keyword), and [choosing `target`](https://www.learningtypescript.com/articles/why-increase-your-tsconfig-target)
- [Google TypeScript style guide](https://google.github.io/styleguide/tsguide.html)
- [Parse, don't validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/) and [Alexis King's writing](https://lexi-lambda.github.io/)
- [Zod basics](https://zod.dev/basics)
- [tsd](https://github.com/tsdjs/tsd)
- [Cursor `typescript-best-practices` skill](https://github.com/cursor/plugins/blob/main/pstack/skills/typescript-best-practices/SKILL.md)
