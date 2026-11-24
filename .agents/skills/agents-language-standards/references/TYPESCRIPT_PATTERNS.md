# TypeScript Patterns

Worked examples for rules in `TYPESCRIPT_STANDARDS.md`. The standards are the rules; this file shows their code shape. Each heading names the rule it illustrates.

## Discriminated unions

```ts
// Don't: a boolean plus optionals lets contradictory states exist.
type DiffState = { loading: boolean; diff?: GitDiff; error?: string };

// Do: only valid states exist.
type DiffState =
  | { kind: "loading" }
  | { kind: "ready"; diff: GitDiff }
  | { kind: "error"; error: string };
```

## Exhaustiveness

```ts
// Value-returning switch
function area(s: Shape): number {
  switch (s.kind) {
    case "circle":
      return Math.PI * s.radius ** 2;
    case "rect":
      return s.width * s.height;
    default: {
      const _exhaustive: never = s;
      return _exhaustive;
    }
  }
}

// Statement switch
function draw(s: Shape): void {
  switch (s.kind) {
    case "circle":
      drawCircle(s);
      break;
    case "rect":
      drawRect(s);
      break;
    default: {
      const _exhaustive: never = s;
      void _exhaustive;
    }
  }
}
```

## Constructive modeling

```ts
type NonEmpty<T> = [T, ...T[]];

// Don't: every caller repeats the length check.
function pickWinner(entries: string[]): string {
  if (entries.length === 0) throw new Error("no entries");
  return entries[Math.floor(Math.random() * entries.length)];
}

// Do: an empty value of the type cannot exist.
function pickWinner(entries: NonEmpty<string>): string {
  return entries[Math.floor(Math.random() * entries.length)];
}

// Where a plain T[] arrives, narrow once; the fact then travels in the type.
const isNonEmpty = <T>(xs: T[]): xs is NonEmpty<T> => xs.length > 0;

// Even length, as pairs.
type Pairs<T> = [T, T][];

// Don't: a comment holds the invariant.
type TimeRange = { start: Date; end: Date }; // start <= end

// Do: a negative range cannot be written; derive the end when needed.
type TimeRange = { start: Date; durationMs: number };
```

## Simplest total type

```ts
// Keep T[]: every operation is total ([] sums to 0).
const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);

// Don't: partiality smuggled past the compiler.
function newestSession(sessions: Session[]): Session {
  return sessions.at(0)!;
}

// Do: strengthen the input...
function newestSession(sessions: NonEmpty<Session>): Session {
  return sessions[0];
}

// ...or weaken the result.
function newestSession(sessions: Session[]): Session | undefined {
  return sessions[0];
}
```

## Schemas before hand-written guards

```ts
// Don't: an assertion, or a guard that checks less than it claims.
const user = data as User;
function isUser(data: unknown): data is User {
  return typeof data === "object" && data !== null && "id" in data;
}

// Do: one schema owns validation; the type is inferred from it.
const UserSchema = z.object({ id: z.string().uuid(), name: z.string() });
type User = z.infer<typeof UserSchema>;

function parseUser(input: unknown): User {
  return UserSchema.parse(input);
}

// When the type is declared first, annotate the schema with it:
// removing `name` from the schema now fails to compile.
type Account = { id: string; name: string };
const AccountSchema: z.ZodType<Account> = z.object({
  id: z.string(),
  name: z.string(),
});
```

## Removing an `as` or `!`

Find why TypeScript cannot infer the type, then fix that cause:

- Missing discriminant: add one and switch to a discriminated union.
- Overly wide source type, such as `Record<string, unknown>`: narrow it at the boundary.
- Untyped boundary: parse with the schema that owns the shape; add a schema only where none exists.
- Partial operation on a collection: strengthen the input or weaken the result (Simplest total type).
- Object literal checked against a type: use `satisfies`, which keeps literal types.

```ts
// Don't: widens and claims the result.
const config = { theme: "dark", cols: 3 } as Config;

// Do: checks the shape; config.theme stays "dark".
const config = { theme: "dark", cols: 3 } satisfies Config;
```

## Narrowing order

```ts
function area(s: Shape): number {
  if ("radius" in s) return Math.PI * s.radius ** 2; // narrowed to circle
  return s.width * s.height; // narrowed to rect
}

// A guard only when the built-in narrowings cannot express the check.
function isCircle(s: Shape): s is Extract<Shape, { kind: "circle" }> {
  return s.kind === "circle";
}
```

## Branded types

```ts
type AgentId = string & { readonly __brand: "AgentId" };

function isAgentId(input: string): input is AgentId {
  return isUuid(input);
}

function parseAgentId(input: string): AgentId {
  if (!isAgentId(input)) throw new Error(`Invalid agent id: ${input}`);
  return input;
}

function focusAgent(id: AgentId): void {
  // id is trusted here
}
```

## Derived types

```ts
// Don't: a duplicate shape drifts when the generated type changes.
type CheckSummary = {
  totalCount: number;
  checks: { name: string; status: string }[];
};
function renderChecks(summary: CheckSummary) {}

// Do: derive from the source of truth.
import type { ChecksMessage } from "./generated/checks";
function renderChecks(summary: Pick<ChecksMessage, "totalCount" | "checks">) {}
```

## Object parameters

```ts
// Don't: swap two arguments and it still compiles.
openFile(uri, { startLine: 10, startColumn: 1, endLine: 10, endColumn: 1 });

// Do: order-independent and self-documenting.
openFile({
  uri,
  selection: { startLine: 10, startColumn: 1, endLine: 10, endColumn: 1 },
});
```
