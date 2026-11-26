import './item-4';

// imports
// 🧠 One-line summary (anchor memory)

// Side-effect import = execute module
// Proper import = use module

// | Tool   | Behavior                               |
// | ------ | -------------------------------------- |
// | `tsc`  | Type checker + compiler                |
// | `tsx`  | Runtime executor (ignores type errors) |
// | ESLint | Style + some static rules              |

// 🧠 Why we don’t use tsx in production

// tsx:

// compiles on the fly
// slower startup
// hides errors
// not deterministic

// Production needs:

// predictable builds
// faster startup
// no hidden type issues
