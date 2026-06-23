# Changelog

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
