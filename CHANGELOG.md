# Changelog

## 2.0.0

### Major Changes

- 220c162: # Loggatron 2.0.0 — modernization release

  This release modernizes the entire toolchain, refactors the codebase for clarity, and replaces the in-house stack-trace parser with a battle-tested third-party library. The public API is unchanged — `init` / `configure` / `destroy` / `getInstance` / `COLORS` — but the build output and dependency footprint differ enough to warrant a major bump.

  ## Breaking changes
  - **Build output filenames have changed.** The `exports` / `main` / `module` / `types` fields in `package.json` are updated to match, so consumers using `import 'loggatron'` are unaffected. Anyone deep-importing internal paths needs to update them:
    - `dist/index.cjs.js` → `dist/index.cjs`
    - `dist/index.esm.js` → `dist/index.mjs`
    - `dist/types/index.d.ts` → `dist/index.d.mts` / `dist/index.d.cts`
  - **Package is now `"type": "module"`.** Both ESM and CJS are still shipped, resolved via the `exports` field. Some legacy CommonJS-only setups may need to use the `require` condition explicitly.
  - **One runtime dependency was added: [`stacktrace-parser`](https://www.npmjs.com/package/stacktrace-parser)** (~2 kB gzipped). Loggatron is no longer strictly zero-dependency. The README's "Tiny footprint" bullet replaces the old "Zero Dependencies" claim.
  - **Stack-trace context attribution now falls back to `node_modules` frames** when no application frame is present in the searched window. Previously such logs rendered with empty context. App frames are still always preferred — this only affects logs that originate fully inside a third-party library.
  - **Minimum supported Node.js is now `>=20.10.0`** (declared via `engines.node`).

  ## Internal refactor (non-breaking, included for transparency)
  - Renamed `src/logger.ts` → `src/loggatron.ts` (the `Loggatron` class lives there).
  - Extracted singleton runtime (`init` / `configure` / `destroy` / `getInstance`) into a dedicated `src/runtime.ts`. `src/index.ts` is now export-only.
  - Split `formatLog` into small internal helpers (`isEmptyLog`, `formatSeparator`, `buildContextParts`, `buildMainMessageArgs`) — same behavior, lighter orchestration.
  - Replaced the in-house multi-regex stack parser with `stacktrace-parser`. Removed `src/constants/regex-patterns.ts`, `src/constants/stack-trace.ts`, `src/utils/file-name.ts`, and `src/utils/function-name.ts` (~150 LOC removed).
  - Split `isInternalFile` into `isLoggatronInternal` + `isNodeModules` to support the new fallback-frame strategy.

  ## Tooling & build
  - **Build tool: rollup → [tsdown](https://tsdown.dev/)** (rolldown-powered). Builds run in ~500 ms; published bundle is ~21 % smaller (12.65 kB vs 16.07 kB ESM, 3.85 kB vs 4.33 kB gzipped).
  - Stricter `tsconfig.json`: `moduleResolution: "bundler"`, `declarationMap`, `sourceMap`, `noImplicitOverride`.
  - `LICENSE` file added (MIT). Previously declared in `package.json` but missing from the package tarball.

  ## Release & CI
  - **Versioning: `standard-version` → [Changesets](https://github.com/changesets/changesets).** All `release:*` / `publish:*` scripts collapsed into a single `release: changeset publish`.
  - **Publishing: now uses npm Trusted Publishing (OIDC).** No `NPM_TOKEN` secret required; published packages carry [npm provenance](https://docs.npmjs.com/generating-provenance-statements).
  - New `.github/workflows/release.yml` with two opt-in skip mechanisms:
    - `[skip release]` in the commit message — runs lint/test/build, skips the version/publish step.
    - `workflow_dispatch` input `dry_run: true` — same effect for manual runs.
  - New `.github/workflows/ci.yml` upgraded to `actions/checkout@v6`, `actions/setup-node@v6`, Node `24.15.0`.
  - New `renovate.json` for automated, grouped dependency updates (Europe/Rome timezone, 5 PR concurrency cap).
  - `lint-staged` config no longer runs ESLint on JSON/Markdown files (was causing `pre-commit` failures on non-source files).

  ## Documentation
  - README overhauled: added shields.io badges, table of contents, multi-package-manager install snippet, new **Requirements** and **Contributing & Releasing** sections, and the new release-skipping flags.
  - README's "Related Packages" section removed (was unmaintained competitor list).
  - Deprecated `rollup-plugin-terser` examples replaced with `@rollup/plugin-terser`.

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.2.2](https://github.com/Raycas96/loggatron/compare/v1.2.0...v1.2.2) (2025-11-15)

### Features

- **logger:** add URL handling for function name extraction ([#13](https://github.com/Raycas96/loggatron/issues/13)) ([56595d7](https://github.com/Raycas96/loggatron/commit/56595d7b891249542fc62783ff3fc0b2d893af6a))

### [1.2.1](https://github.com/Raycas96/loggatron/compare/v1.2.0...v1.2.1) (2025-11-12)

### Bug Fixes

- **logger:** add URL handling for function name extraction ([5f78a94](https://github.com/Raycas96/loggatron/commit/5f78a94e584192a66df2b929ea8d9d2c1fd2641d))
- remove useless escape char ([bdf6d74](https://github.com/Raycas96/loggatron/commit/bdf6d744224b2382ce27c662187b9b31c80d5a12))

## [1.2.0](https://github.com/Raycas96/loggatron/compare/v1.2.0-beta.2...v1.2.0) (2025-11-11)

### Features

- add separator color, skipOnEmptyLog, addNewLine, and rename showComponentName ([840534b](https://github.com/Raycas96/loggatron/commit/840534b66a913f203826efa0c6b2fcf71ec1f011))

## [1.2.0-beta.2](https://github.com/Raycas96/loggatron/compare/v1.2.0-beta.1...v1.2.0-beta.2) (2025-11-09)

## [1.2.0-beta.1](https://github.com/Raycas96/loggatron/compare/v1.2.0-beta.0...v1.2.0-beta.1) (2025-11-09)

## [1.2.0-beta.0](https://github.com/Raycas96/loggatron/compare/v1.1.1-alpha.1...v1.2.0-beta.0) (2025-11-07)

### Features

- **config:** add addNewLine configuration option ([41a9092](https://github.com/Raycas96/loggatron/commit/41a90921b38fc0619fbc62fb325015ad9c4ea7cf))
- **separator:** add color configuration support ([1d01b52](https://github.com/Raycas96/loggatron/commit/1d01b52e70dbd16573e0fd92ca4315f47099bf60))

### Bug Fixes

- use method.Config.separator.color directly ([2290ce5](https://github.com/Raycas96/loggatron/commit/2290ce5364acf492bd7a3ee4b248e2361818a459))
- **config:** add addNewLine to MergedMethodConfig for method overrides ([c8b054e](https://github.com/Raycas96/loggatron/commit/c8b054e08b7913e64d22c75740d367f0beaa03bc))
- **package:** remove type module for NestJS compatibility ([5d1a6ec](https://github.com/Raycas96/loggatron/commit/5d1a6ecd3fa3d47827a11b4f6a71aa90e001e149))
- **separator:** always use console.log for separator output ([4fe36e5](https://github.com/Raycas96/loggatron/commit/4fe36e5cf6daedf39851b86cc010df343c4888fa))

### [1.1.1-alpha.1](https://github.com/Raycas96/loggatron/compare/v1.1.1-alpha.0...v1.1.1-alpha.1) (2025-11-06)

### [1.1.1-alpha.0](https://github.com/Raycas96/loggatron/compare/v1.1.0...v1.1.1-alpha.0) (2025-11-06)

### Bug Fixes

- fix package.json and add new scripts ([a7c81f3](https://github.com/Raycas96/loggatron/commit/a7c81f3d22b91241f4ced209515644be756b9ca8))

## 1.1.0 (2025-11-06)

### Features

- add missing packages ([398c81f](https://github.com/Raycas96/loggatron/commit/398c81f04ef5c0e4a0ce53a8e9ba9d79985a365e))
- export colors const ([16896e4](https://github.com/Raycas96/loggatron/commit/16896e4c1f6c52c4876e7d942f98171777b5cf0e))
- ignore md file in eslintrc ([27cb731](https://github.com/Raycas96/loggatron/commit/27cb73117322775c0bd7feed904a39ac24bed747))
- implement tests ([a562b49](https://github.com/Raycas96/loggatron/commit/a562b493a1b01f8a1b471769d13305357f7387b6))
- use initialize global var and remove useless override ([20775b0](https://github.com/Raycas96/loggatron/commit/20775b047e068f0524713aa85dcb238172857126))

### Bug Fixes

- enable execution of husky hooks ([d79b9db](https://github.com/Raycas96/loggatron/commit/d79b9db26842707d26bcd6899a15490a99fc6123))
- fix lint problems ([efbf209](https://github.com/Raycas96/loggatron/commit/efbf2095eb5d5592224ef95e4bc69e7b41e85583))
- fix overrides in tests ([10af183](https://github.com/Raycas96/loggatron/commit/10af1833ea7e2a408c0b234e5a3d11ce11261f2d))
- remove unused import ([1109042](https://github.com/Raycas96/loggatron/commit/110904298c27cd81196d97b71ec3ff0ae4786036))
- removed deprecated eslintignore ([de8fa62](https://github.com/Raycas96/loggatron/commit/de8fa62708638a623512edfcaac9a254552d3058))
