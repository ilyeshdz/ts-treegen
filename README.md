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
- **Runtime agnostic** — Core (`ts-treegen`) has zero runtime dependencies. I/O is abstracted behind a `FileSystem` interface. Use `ts-treegen/node` for Node.js convenience.

## Install

```sh
npm install ts-treegen
```

## Usage

### Core (runtime-agnostic)

The core `plan()` requires a `FileSystem` provider. Use it with any runtime by passing your own I/O implementation.

```ts
import { file, dir, emit, plan } from "ts-treegen";
import type { FileSystem } from "ts-treegen";

// Provide a FileSystem for any runtime
const myFs: FileSystem = {
  cwd: () => "/my/project",
  access: async (path) => {
    /* check existence */
  },
  mkdir: async (path, opts) => {
    /* create directory */
  },
  writeFile: async (path, content) => {
    /* write file */
  },
};

const files = await emit(
  file("README.md", "# Hello"),
  dir("src", file("index.ts", "console.log('hi');")),
);

const p = await plan(files, { targetDir: "./output", fs: myFs });
console.log(p.files[0].status); // "write"
await p.run();
```

### Node.js

The `ts-treegen/node` subpath pre-wires Node.js `fs/promises` so `plan()` works out of the box.

```ts
import { file, dir, emit, plan } from "ts-treegen/node";

const files = await emit(
  file("README.md", "# Hello"),
  dir("src", file("index.ts", "console.log('hi');")),
);

const p = await plan(files, { targetDir: "./output" });
await p.run();
```

### Symlinks and executable files

```ts
import { file, link, emit, plan } from "ts-treegen/node";

const files = await emit(
  file("bin/run.sh", "#!/bin/sh\necho hi", { mode: 0o755 }),
  link("latest", "bin/run.sh"),
);

await plan(files, { targetDir: "./output" }).then((p) => p.run());
```

`link()` creates a symbolic link (only the link location is
path-checked — the target may point outside the tree). The `mode`
option on `file()` applies chmod bits after writing. Custom
`FileSystem` implementations only need the optional `symlink()` /
`chmod()` methods when plans actually use them; otherwise `run()`
fails fast with a clear error.

### Browser / Deno / Bun

Pass a custom `FileSystem` to `plan()` via the core import. The interface has only four methods, making it trivial to implement for any environment.

## License

MIT
