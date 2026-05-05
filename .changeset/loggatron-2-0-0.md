---
'loggatron': major
---

# Loggatron 2.0.0 — modernization release

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
