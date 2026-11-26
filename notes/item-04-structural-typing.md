# Item 4: Get Comfortable with Structural Typing

## Rule

TypeScript uses structural typing: a value is assignable if it has the required shape, even if it has extra properties or was not created from the named type.

## Why It Matters

Types are open, not sealed. A value typed as `Vector3D` can still have more properties than `x`, `y`, and `z`, and a value typed as a class can be a plain object with the same public shape. This is useful for flexible APIs and tests, but it can cause bugs when code assumes the type describes the whole runtime object.

## Look For In Reviews

- Code that assumes `Object.keys(value)` only returns keys declared in the TypeScript type.
- Loops over object keys where extra runtime properties could break assumptions.
- Class-typed values being trusted as if they were definitely constructed by that class.
- Functions requiring a concrete class when they only need a small method/property shape.
- Tests that could use a small structural fake instead of a heavy real dependency.

## Better Pattern

Do not loop over keys when the valid fields are known:

```ts
interface Vector3D {
  x: number;
  y: number;
  z: number;
}

function calculateLengthL1(v: Vector3D) {
  return Math.abs(v.x) + Math.abs(v.y) + Math.abs(v.z);
}
```

Use structural typing intentionally for dependencies:

```ts
interface Database {
  runQuery(sql: string): unknown[];
}

function getAuthors(database: Database) {
  return database.runQuery("SELECT * FROM authors");
}

const testDatabase: Database = {
  runQuery() {
    return [{ name: "Toni Morrison" }];
  },
};
```

## Reviewer Comment

> **Review comment:** This code assumes the TypeScript type is an exact description of the runtime object, but TypeScript types are structural and open. Could this value have extra properties, or be a plain object with the same shape? If the valid fields are known, prefer accessing them directly; if we only need a small dependency shape, accept an interface for that shape instead of a concrete class.
