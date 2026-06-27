# ts-treegen

Tiny, low-level engine for programmatic file generation.

[![Open on npmx.dev](https://npmx.dev/api/registry/badge/version/ts-treegen)](https://npmx.dev/package/ts-treegen)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/size/ts-treegen)](https://npmx.dev/package/ts-treegen)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/license/ts-treegen)](https://npmx.dev/package/ts-treegen)

`ts-treegen` is a zero-dependency, ultra-lightweight engine designed to describe complex file structures completely as data and safely resolve them. it acts as the functional compilation layer that you can build your own generators, scaffolding tools, and clis on top of.

## features

- **protocol driven:** trees are pure, immutable virtual structures resolved with async functions and indexed loops for optimal memory usage.
- **zero-abstraction layouts:** no custom template tags or conditional wrapper nodes. use standard javascript logic (`isTs && file()`) directly.
- **fail-fast safety:** built-in deep path verification traps directory traversal and absolute path escapes before anything touches the disk.
- **runtime agnostic:** built with modern, native standards. runs everywhere (node.js, bun, deno).

## quick start

```ts
import { file, dir, emit, write } from "ts-treegen";

const isProduction = process.env.NODE_ENV === "production";

// 1. build your layout configuration completely as pure data
const files = await emit(
  file("README.md", "# my new app setup"),

  dir(
    "src",
    file("index.js", "console.log('hello core engine');"),
    // native js conditionals are handled gracefully out-of-the-box
    !isProduction && file("debug-logger.js", "console.warn('dev mode enabled');"),
    // objects are automatically stringified to pretty json
    file("package.json", { name: "my-app", version: "1.0.0" }),
  ),
);

// 2. returns an explicit flat array of virtual objects ready to process
console.log(files);
// [
//   { path: "README.md", content: "# my new app setup" },
//   { path: "src/index.js", content: "console.log('hello core engine');" },
//   { path: "src/package.json", content: "{\n  \"name\": \"my-app\",\n..." }
// ]

// 3. persist the files safely onto the local disk (automatically handles parent directories)
await write(files, { targetDir: "./output" });
```

## api

### `file(name, content?)`

creates a virtual file node.

- `name`: string — relative file path.
- `content?`: [`FileContent`](#types) — optional content (string, `Uint8Array`, plain object, or async factory function).

### `dir(name, ...children)`

creates a virtual directory node. deeply flattens arrays and filters out falsy values. passing `""` as name creates a root boundary.

- `name`: string — directory name.
- `children`: any[] — nested nodes or arrays thereof.

### `emit(...nodes)`

compiles nodes into a flat array of `VirtualFile` objects. validates and normalizes all paths via defensive checks.

- `nodes`: any[] — nodes to compile.
- returns: `Promise<VirtualFile[]>`

### `write(files, options?)`

writes an array of virtual files to disk using native I/O apis. recursively creates parent directories.

- `files`: `VirtualFile[]` — array of files to write.
- `options.targetDir?`: string — base output directory (defaults to `process.cwd()`).

### types

```ts
interface VirtualFile {
  path: string;
  content: string | Uint8Array;
}

type FileContent = string | Uint8Array | Record<string, any> | (() => any | Promise<any>);
```

## license

MIT
