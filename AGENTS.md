# ts-treegen agent guide

## Commands (run from root)

| Command           | What                                           |
| ----------------- | ---------------------------------------------- |
| `pnpm build`      | Bundle with tsdown                             |
| `pnpm dev`        | tsdown --watch                                 |
| `pnpm test`       | Vitest in run mode (all tests in `tests/`)     |
| `pnpm test:watch` | Vitest in watch mode for local development     |
| `pnpm typecheck`  | `tsc --noEmit`                                 |
| `pnpm lint`       | oxlint                                         |
| `pnpm lint:fix`   | oxlint --fix                                   |
| `pnpm fmt`        | oxfmt                                          |
| `pnpm fmt:check`  | oxfmt --check                                  |
| `pnpm release`    | release-it (bumps, tags, publishes, changelog) |

Pre-commit runs: `fmt && lint:fix && test`.

## Toolchain quirks

- **pnpm** (v11.8.0) required — no `npm`/`yarn`.
- **oxlint** + **oxfmt** instead of ESLint/Prettier. Config: `.oxlintrc.json`, `.oxfmtrc.json`.
- **tsdown** for bundling (not tsc). `tsconfig.json` only emits declarations (`emitDeclarationOnly: true`).
- TypeScript `module: "preserve"` + `verbatimModuleSyntax` — source uses `.js` extensions in imports (e.g. `./protocol.js`). Tests import from `../src/index.js`, not `.ts`.
- **vitest** (no jest). Test files: `tests/index.test.ts`, `tests/memory.test.ts`, `tests/node.test.ts`, `tests/runtimes.test.ts`.
- CI workflows in `.github/workflows/`: `ci.yml` (fmt, lint, typecheck, test, build), `release.yml` (manual release-it), `nightly.yml` (scheduled nightly release).

## Architecture

- **`src/protocol.ts`** — `PlateNode` interface (branded with `PLATE_SYMBOL`), `VirtualFile` type.
- **`src/primitives.ts`** — `file()` and `dir()` factory functions. `dir("", ...)` creates a transparent root boundary. `dir` auto-filters falsy children and deeply flattens arrays.
- **`src/engine.ts`** — `emit(...nodes)` — wraps nodes in a root `dir("")` and calls `generate("")`.
- **`src/plan.ts`** — `plan(files, opts)` — deferred write plan with `overwrite: false` skip logic. `.run()` writes concurrently (max 50).
- **`src/utils.ts`** — `sanitizePath()` guards against traversal/absolute path escapes.

## Style

- Conventional Commits (used by release-it for changelog). Use `type: short description` format — no scope (e.g. `feat: add FileSystem interface`, not `feat(plan): add FileSystem interface`).
- No commented code. Prefer early returns, indexed loops over `for...of`.
