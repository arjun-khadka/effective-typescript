# Item 3: Understand That Code Generation Is Independent of Types

## Rule

Do not expect TypeScript types to change runtime behavior. Types are checked by the compiler, then erased from the generated JavaScript.

## Why It Matters

Runtime code cannot inspect interfaces, type aliases, or assertions because they do not exist after compilation. This can lead to bugs when code assumes a type check, type assertion, or annotation will validate real data.

Unlike Java or C#, TypeScript types are mostly not part of the runtime. They are a compile-time layer over JavaScript, so annotations can guide the compiler but cannot change or validate the actual value that arrives at runtime.

## Look For In Reviews

- Runtime checks using `instanceof` against an `interface` or `type`.
- Type assertions like `as number` being used as if they convert or validate values.
- External data typed with an interface but not validated at runtime.
- Code that assumes TypeScript type errors will always stop JavaScript output.
- Performance concerns based only on TypeScript types; erased types do not affect runtime speed.

## Better Pattern

Use runtime data that actually exists in JavaScript, such as property checks:

```ts
interface Square {
  width: number;
}

interface Rectangle extends Square {
  height: number;
}

type Shape = Square | Rectangle;

function calculateArea(shape: Shape) {
  if ("height" in shape) {
    return shape.width * shape.height;
  }

  return shape.width * shape.width;
}
```

Or use a tagged union:

```ts
type Shape =
  | { kind: "square"; width: number }
  | { kind: "rectangle"; width: number; height: number };

function calculateArea(shape: Shape) {
  if (shape.kind === "rectangle") {
    return shape.width * shape.height;
  }

  return shape.width * shape.width;
}
```

If a value needs conversion, use real JavaScript conversion:

```ts
function asNumber(value: number | string): number {
  return Number(value);
}
```

For external data, treat the value as `unknown` first and validate it before use:

```ts
interface LightApiResponse {
  lightSwitchValue: boolean;
}

function isLightApiResponse(value: unknown): value is LightApiResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "lightSwitchValue" in value &&
    typeof value.lightSwitchValue === "boolean"
  );
}

async function setLight() {
  const response = await fetch("/light");
  const result: unknown = await response.json();

  if (!isLightApiResponse(result)) {
    throw new Error("Invalid light API response");
  }

  setLightSwitch(result.lightSwitchValue);
}
```

For repeated API responses, prefer a runtime schema so validation and TypeScript types stay together:

```ts
import { z } from "zod";

const LightApiResponseSchema = z.object({
  lightSwitchValue: z.boolean(),
});

type LightApiResponse = z.infer<typeof LightApiResponseSchema>;

async function setLight() {
  const response = await fetch("/light");
  const result: LightApiResponse = LightApiResponseSchema.parse(
    await response.json(),
  );

  setLightSwitch(result.lightSwitchValue);
}
```

## Reviewer Comment

> **Review comment:** This relies on TypeScript-only information, but types are erased from the JavaScript that runs. If this code needs runtime behavior, can we make that behavior explicit with real JavaScript: validate external data, parse or convert values, check an actual property, use a discriminant field, use a class value that exists at runtime, or parse with a schema such as Zod?
>
> For external data specifically, a TypeScript annotation is not validation. Can we treat the raw value as `unknown` and validate it before the rest of the code trusts it?
