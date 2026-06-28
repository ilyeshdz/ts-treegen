# ts-treegen

Tiny, low-level engine for programmatic file generation.

[![Open on npmx.dev](https://npmx.dev/api/registry/badge/version/ts-treegen)](https://npmx.dev/package/ts-treegen)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/size/ts-treegen)](https://npmx.dev/package/ts-treegen)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/license/ts-treegen)](https://npmx.dev/package/ts-treegen)

A zero-dependency, ultra-lightweight engine to describe complex file structures as data and resolve them safely. Acts as a functional compilation layer for building generators, scaffolding tools, and CLIs.

## Features

- **Protocol driven** — Trees are pure, immutable virtual structures resolved with async functions and indexed loops for optimal memory usage.
- **Zero-abstraction layouts** — No custom template tags or conditional wrapper nodes. Use standard JavaScript logic (`isProd && file(...)`) directly.
- **Fail-fast safety** — Built-in deep path verification traps directory traversal and absolute path escapes before anything touches the disk.
- **Runtime agnostic** — Built with modern, native standards. Runs everywhere (Node.js, Bun, Deno).

## Quick start

```ts
import { file, dir, emit, plan } from "ts-treegen";

const isProduction = process.env.NODE_ENV === "production";

// 1. Build your layout as pure data
const files = await emit(
  file("README.md", "# My New App"),

  dir(
    "src",
    file("index.ts", "console.log('hello');"),
    !isProduction && file("debug.ts", "console.warn('dev mode');"),
    file("package.json", { name: "my-app", version: "1.0.0" }),
  ),
);

// 2. Inspect the resolved tree
console.log(files);
// [
//   { path: "README.md", content: "# My New App" },
//   { path: "src/index.ts", content: "console.log('hello');" },
//   { path: "src/package.json", content: "{\n  \"name\": \"my-app\",\n..." }
// ]

// 3. Plan what to write (no disk I/O yet)
const p = await plan(files, { targetDir: "./output" });

// 4. Check what will happen
console.log(p.files[0].status); // "write"

// 5. Execute
await p.run();
```

## License

MIT
