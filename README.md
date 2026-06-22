# ts-treegen

Tiny, low-level engine for programmatic file generation.

[![Open on npmx.dev](https://npmx.dev/api/registry/badge/version/ts-treegen)](https://npmx.dev/package/ts-treegen)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/size/ts-treegen)](https://npmx.dev/package/ts-treegen)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/license/ts-treegen)](https://npmx.dev/package/ts-treegen)

`ts-treegen` is a zero-dependency, ultra-lightweight engine designed to describe complex file structures completely as data and safely resolve them. It acts as the functional compilation layer that you can build your own generators, scaffolding tools, and scaffolding CLIs on top of.

## Features

- **Protocol Driven:** Trees are pure, immutable virtual structures driven by asynchronous generator streams.
- **Zero-Abstraction Layouts:** No custom template tags or conditional wrapper nodes. Use standard JavaScript elements (`isTs && file()`) directly.
- **Fail-Fast Safety:** Built-in deep path verification traps directory traversal and absolute path escapes before anything touches the disk.

## Quick Start

```ts
import { file, dir, emit } from "ts-treegen";

const isProduction = process.env.NODE_ENV === "production";

// 1. Build your layout configuration completely as pure data
const manifest = await emit(
  file("README.md", "# My New App Setup"),
  
  dir("src",
    file("index.js", "console.log('Hello Core Engine');"),
    // Native JS conditionals are fully handled gracefully out-of-the-box
    !isProduction && file("debug-logger.js", "console.warn('Dev Mode Enabled');")
  )
);

// 2. Returns an explicit flat array of virtual objects ready to process
console.log(manifest);
// [
//   { path: "README.md", content: "# My New App Setup" },
//   { path: "src/index.js", content: "console.log('Hello Core Engine');" }
// ]