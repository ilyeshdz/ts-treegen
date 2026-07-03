# Changelog

## [1.0.0](https://github.com/ilyeshdz/ts-treegen/compare/0.4.0...1.0.0) (2026-07-03)

### ⚠ BREAKING CHANGES

* FileSystem.access(path) is now FileSystem.exists(path)
and returns Promise<boolean> instead of throwing on missing files.
This is a clearer name for the operation (existence check, not
permission check) and the boolean return type eliminates the need
for try-catch in overwrite logic.

Updated all implementations: node, deno, bun, cloudflare, and memory.

### Features

* add Cloudflare Workers FileSystem implementation ([dfe7c2e](https://github.com/ilyeshdz/ts-treegen/commit/dfe7c2eb9fee1dc242e1df04167b8aa12ae9452d))
* add deno, bun, memory, and cloudflare subpath modules ([83a24f3](https://github.com/ilyeshdz/ts-treegen/commit/83a24f3ea734287d7fee839943b30392b1ad40e7))
* rename FileSystem.access() to FileSystem.exists() ([b27cb5d](https://github.com/ilyeshdz/ts-treegen/commit/b27cb5d538591f47e398b53f1a906f461398d385))
* runtime-agnostic core with FileSystem interface ([d13c949](https://github.com/ilyeshdz/ts-treegen/commit/d13c949581e9eb6536b0fa8476c08f4e93ceb81a))

### Bug Fixes

* make MemoryFileSystem.mkdir track directories and validate parent ([29112fb](https://github.com/ilyeshdz/ts-treegen/commit/29112fbbfe24e101f95b293b2fe34d4de325201b))
* only swallow ENOENT/ENOTDIR in overwrite check, rethrow others ([071bc68](https://github.com/ilyeshdz/ts-treegen/commit/071bc684c4dda03c29375e09e737770538cfa6c1))
* prevent unhandled promise rejections in runConcurrently ([69b3611](https://github.com/ilyeshdz/ts-treegen/commit/69b3611a24aba546a16fcc28bc7249e56c6ecddf))
* use pnpm instead of npm in pre-commit hook ([c9b12c4](https://github.com/ilyeshdz/ts-treegen/commit/c9b12c4a0ac388c651a5e09035012963d4296d9e))

### Documentation

* clarify conventional commit style (no scope) ([aec8054](https://github.com/ilyeshdz/ts-treegen/commit/aec8054c6e68e35649da2a071d5119e1c5b75003))

## [0.4.0](https://github.com/ilyeshdz/ts-treegen/compare/0.3.3...0.4.0) (2026-07-03)

### Features

* replace write() with plan() ([9d940e9](https://github.com/ilyeshdz/ts-treegen/commit/9d940e9bf5408edec220c5bee42b2523443b30f1))

### Bug Fixes

* inline PlanFileStatus type into PlanFile ([bd8b988](https://github.com/ilyeshdz/ts-treegen/commit/bd8b988b396408f48ebedae77df40278be5a64b0))
* re-export PLATE_SYMBOL from main entry point ([d7b7861](https://github.com/ilyeshdz/ts-treegen/commit/d7b78612f24fe209d12548419a438a6b7bd6d094))
* remove unused DirChild export from public API ([f792194](https://github.com/ilyeshdz/ts-treegen/commit/f79219442eabfc272c0e8333a58cd331d38c12c3))

### Documentation

* rewrite README without API section ([361766a](https://github.com/ilyeshdz/ts-treegen/commit/361766a4fb5aa7dd2596eb27cae9ba99be421705))
* update README for plan() API ([2dc1705](https://github.com/ilyeshdz/ts-treegen/commit/2dc17059dc0c4476cabe5d6387afeb82d6d5e68e))

### Performance

* remove unnecessary array copy in runConcurrently ([aee008a](https://github.com/ilyeshdz/ts-treegen/commit/aee008a79eb33bcfcb3c1d23eb149b63819d2f24))

## [0.3.3](https://github.com/ilyeshdz/ts-treegen/compare/0.3.2...0.3.3) (2026-06-28)

### Bug Fixes

* add explicit Promise<void> return type to write() ([4b860f4](https://github.com/ilyeshdz/ts-treegen/commit/4b860f41b8cbbb8d064ae2da3591154b30704af3))
* check all elements when flattening nested arrays ([d91be6c](https://github.com/ilyeshdz/ts-treegen/commit/d91be6cb4b879f32061b2ff6631691ad74f188ad))
* replace any with unknown in FileContent and dir children ([23dd988](https://github.com/ilyeshdz/ts-treegen/commit/23dd9880cbffeb0a925ee80806674ae8220bcc0c))
* type emit parameters as PlateNode[] ([dd3047a](https://github.com/ilyeshdz/ts-treegen/commit/dd3047a332f8abdacb2f751c647a3f3612e0ebc1))

### Documentation

* update protocol driven description to match source code ([29dad98](https://github.com/ilyeshdz/ts-treegen/commit/29dad98fab768b4cf039ff17711c1b1bc12b8a45))

## [0.3.2](https://github.com/ilyeshdz/ts-treegen/compare/0.3.1...0.3.2) (2026-06-23)

### Bug Fixes

* add type assertion to flattenIfNested return ([25c8573](https://github.com/ilyeshdz/ts-treegen/commit/25c85733abda96b204e9264bda8f8080ef043598))

### Performance

* defer array flattening in dir() to avoid unnecessary copy ([becf74a](https://github.com/ilyeshdz/ts-treegen/commit/becf74aa6f23b73cc93e4b8b48e0f81cd6abb4e6))
* early return in emit for empty input ([1435e64](https://github.com/ilyeshdz/ts-treegen/commit/1435e64eac9530cc966e07660d2ab878fdb5485b))
* optimize content coercion order in file() ([6cd85ec](https://github.com/ilyeshdz/ts-treegen/commit/6cd85ec56db97ac8dd56ee2917deb5221763983a))
* parallelize file writes with concurrency control ([6a35ded](https://github.com/ilyeshdz/ts-treegen/commit/6a35ded454ce43b82ad53a5a53942442130ec029))
* replace for...of and spread with indexed loops in dir.generate ([8840aca](https://github.com/ilyeshdz/ts-treegen/commit/8840acad66edb049c144b49b768dc6c6865689da))

## [0.3.1](https://github.com/ilyeshdz/ts-treegen/compare/0.3.0...0.3.1) (2026-06-23)

### Performance

- move children flattening out of hot path ([2c3a4e8](https://github.com/ilyeshdz/ts-treegen/commit/2c3a4e833b80899f7442ebe4073ac1d47fb3af40))
- replace async generators with direct async collection ([a2ae66a](https://github.com/ilyeshdz/ts-treegen/commit/a2ae66a3ec1a07173202bc5426a00179517bad64))

## [0.3.0](https://github.com/ilyeshdz/ts-treegen/compare/0.2.0...0.3.0) (2026-06-23)

### Features

- enhance documentation with detailed JSDoc comments for core functions ([72a1140](https://github.com/ilyeshdz/ts-treegen/commit/72a11405759e15ca865e54b839f722e50513e50d))

### Bug Fixes

- guard Windows absolute paths and tighten .. check ([870b437](https://github.com/ilyeshdz/ts-treegen/commit/870b4376d1ce2f5ba6dc78dce4e881aa7d774a62))

### Documentation

- update README with new API details and examples ([2dd3d6e](https://github.com/ilyeshdz/ts-treegen/commit/2dd3d6e95815defa1ddf5c2814e6f58907db58d0))

## [0.2.0](https://github.com/ilyeshdz/ts-treegen/compare/0.1.2...0.2.0) (2026-06-23)

### Features

- add nightly workflow for automated releases ([5b0871b](https://github.com/ilyeshdz/ts-treegen/commit/5b0871b4b5cb95cbcd993942308dc42552cf9801))
- add write function for disk serialization ([be8d4ca](https://github.com/ilyeshdz/ts-treegen/commit/be8d4ca98c6f14fba81f7455a04f54689f5e0fec))

## [0.1.2](https://github.com/ilyeshdz/ts-treegen/compare/0.1.1...0.1.2) (2026-06-23)

### Bug Fixes

- make content parameter optional in file function ([eff2ed2](https://github.com/ilyeshdz/ts-treegen/commit/eff2ed2088cdbdd5146ab9191aa9b776f91365d8))
- remove directory traversal check from emit function ([27f505c](https://github.com/ilyeshdz/ts-treegen/commit/27f505cab830b0773a03295a2b62780846b443e6))

## [0.1.1](https://github.com/ilyeshdz/ts-treegen/compare/0.1.0...0.1.1) (2026-06-22)

### Bug Fixes

- handle null, undefined, and empty file content gracefully ([154b0a0](https://github.com/ilyeshdz/ts-treegen/commit/154b0a0f6ee0be26282de4378f3ca5052445e8af))
- harden path resolution against edge cases and traversals ([8448393](https://github.com/ilyeshdz/ts-treegen/commit/84483939e3214769b6e8a6fa256a6bff73619a5d))

## 0.1.0 (2026-06-22)

### Features

- initialize core engine architecture and primitives ([c8103c3](https://github.com/ilyeshdz/ts-treegen/commit/c8103c37115bfb704a95190a8c9777d80a81cde0))

### Documentation

- add npm badges to README.md ([c4b4d17](https://github.com/ilyeshdz/ts-treegen/commit/c4b4d172c753c8a0a78b94dd9ca3cb834fc0d375))
- update README.md with features and quick start guide ([e680e40](https://github.com/ilyeshdz/ts-treegen/commit/e680e4044c9ea491a9ff88919352da394479f381))
