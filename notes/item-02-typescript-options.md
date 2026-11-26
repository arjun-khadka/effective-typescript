# Item 2: Know Which TypeScript Options You're Using

## Rule

Know which compiler options are enabled, configure them in `tsconfig.json`, and aim to use `strict` for the strongest type checking.

## Why It Matters

TypeScript compiler options change core language behavior. A project with weak settings can silently allow unsafe code, especially implicit `any` values and incorrect `null` or `undefined` assumptions.

## Look For In Reviews

- Project settings should live in `tsconfig.json`, not only in command-line flags.
- `noImplicitAny` should be enabled unless the team is still migrating from JavaScript.
- `strictNullChecks` should be enabled so `null` and `undefined` must be handled explicitly.
- Prefer `strict: true` for new TypeScript projects.
- If `strict` is disabled, check whether there is a clear migration reason.

## Better Pattern

```ts
// tsconfig.json
{
  "compilerOptions": {
    "strict": true
  }
}
```

If a value can be `null`, declare that explicitly:

```ts
type UserResponse = {
  id: string;
  name: string | null;
};
```

## Reviewer Comment

Can we enable this option in `tsconfig.json` instead of relying on command-line flags? For a new TypeScript project, I would also expect `strict: true` unless there is a specific migration blocker.
