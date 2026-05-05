# Loggatron

[![npm version](https://img.shields.io/npm/v/loggatron.svg?style=flat-square)](https://www.npmjs.com/package/loggatron)
[![CI](https://github.com/Raycas96/loggatron/actions/workflows/ci.yml/badge.svg)](https://github.com/Raycas96/loggatron/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/npm/l/loggatron.svg?style=flat-square)](./LICENSE)
[![Types: TypeScript](https://img.shields.io/badge/types-TypeScript-blue?style=flat-square)](#api-reference)
[![Tree-shakeable](https://img.shields.io/badge/tree--shakeable-yes-brightgreen?style=flat-square)](#tree-shaking)

A tree-shakeable, configurable logger that intercepts console methods with beautiful separators, colors, emojis, and context information. Configure once and enhance all your console logs with automatic file/component detection and method-specific customization.

## Table of Contents

- [Why Loggatron?](#why-loggatron)
- [Features](#features)
- [Installation](#installation)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Basic Usage](#basic-usage)
- [Method-Specific Overrides](#method-specific-overrides)
- [Advanced Usage](#advanced-usage)
- [Configuration Options](#configuration-options)
- [Removing Console.log in Production Builds](#removing-consolelog-in-production-builds)
- [Tree-Shaking](#tree-shaking)
- [ANSI Color Codes Reference](#ansi-color-codes-reference)
- [Error Handling](#error-handling)
- [Browser Support](#browser-support)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Contributing & Releasing](#contributing--releasing)
- [Changelog](#changelog)
- [License](#license)

## Why Loggatron?

Loggatron exists because no existing logger combined exactly the features below into one small, dependency-light package. If your needs overlap, it should be a good fit:

- Intercepts console methods automatically — no need to replace every `console.log`
- Configurable separators before and after each log
- Method-specific overrides (different formats for `log`, `info`, `error`, etc.)
- Automatic file name, line number, and function/component name detection
- Tree-shakeable and production-ready
- Plays well with build tools that strip `console.*` calls in production

## Features

- 🌳 **Tree-shakeable**: Only import what you use
- 🎨 **Highly Configurable**: Separators, colors, emojis, and method-specific overrides
- 📍 **Context-aware**: Automatically shows file name, line number, and component name
- 🔧 **Method Overrides**: Different formatting for each console method (log, info, warn, error, debug)
- 🌐 **Universal**: Works in Node.js and browser environments
- 🚀 **Production-ready**: Easy to remove all console.log in production builds
- 🪶 **Tiny footprint**: ~3.9 kB gzipped + a single ~2 kB runtime dependency ([`stacktrace-parser`](https://www.npmjs.com/package/stacktrace-parser))

## Installation

```bash
npm install loggatron
# or
pnpm add loggatron
# or
yarn add loggatron
# or
bun add loggatron
```

TypeScript types are bundled — no separate `@types/loggatron` package is needed.

## Requirements

- **Node.js** `>=20.10.0` (also runs in modern browsers)
- ESM and CommonJS are both shipped via the `exports` field, so any modern bundler (Vite, Webpack, Rollup, esbuild, Bun, Rspack, …) and Node.js consume the right format automatically.

## Quick Start

```typescript
import { init } from 'loggatron';

// Initialize once in your main file
init();

// Now all console.log calls will be enhanced
console.log('Hello World');
// Output:
// --------------------------------
// 📝 [MyComponent] (index.ts:42) Hello World
// --------------------------------
```

## Basic Usage

### Simple Initialization

```typescript
import { init } from 'loggatron';

// Initialize with defaults
init();

console.log('This will have separators and context');
console.info('This too');
console.error('Errors are highlighted');
```

### Custom Global Configuration

```typescript
import { init } from 'loggatron';

init({
  separator: {
    preLog: '━━━━━━━━━━━━━━━━━━━━━━━━',
    postLog: '━━━━━━━━━━━━━━━━━━━━━━━━',
    color: '\x1b[97m', // Bright White for separators
  },
  colors: {
    log: '\x1b[36m', // Cyan
    error: '\x1b[31m', // Red
  },
  emojis: {
    log: '✨',
    error: '🔥',
  },
  showFileName: true,
  showFunctionName: true,
  addNewLine: false, // Don't add extra newline after logs
  methods: ['log', 'error', 'warn'], // Only intercept these methods
});
```

## Method-Specific Overrides

The powerful feature of Loggatron is the ability to customize each console method individually:

```typescript
import { init } from 'loggatron';

init({
  // Global defaults
  separator: {
    preLog: '--------------------------------',
    postLog: '--------------------------------',
    color: '\x1b[97m', // Bright White for separators
    skipOnEmptyLog: true, // Skip separators on empty logs
  },
  showFileName: true,
  showFunctionName: true,
  addNewLine: false, // Don't add extra newline

  // Method-specific overrides
  overrides: {
    info: {
      separator: {
        preLog: '', // No separator for info
        postLog: '', // Clean output
        skipOnEmptyLog: false, // Always show separators for info (if set)
      },
      showFileName: false, // Don't show file name for info
      showFunctionName: true, // But still show function name
      addNewLine: true, // Add newline after info logs
    },
    error: {
      separator: {
        preLog: '🚨🚨🚨 ERROR 🚨🚨🚨',
        postLog: '━━━━━━━━━━━━━━━━━━━━━━━━',
        color: '\x1b[91m', // Bright Red for error separators
        skipOnEmptyLog: false, // Always show error separators
      },
      showFileName: true,
      showFunctionName: true,
    },
    debug: {
      separator: {
        preLog: '🐛 DEBUG START 🐛',
        postLog: '🐛 DEBUG END 🐛',
        color: '\x1b[95m', // Bright Magenta for debug separators
      },
      showFileName: true,
      showFunctionName: false, // Hide function name for debug
    },
    warn: {
      showFileName: false, // Simple warning format
      showFunctionName: true,
    },
  },
});

// Now different methods have different formats:
console.log('Full format with separators'); // Uses global config
console.info('Minimal format'); // No separators, no filename
console.error('Enhanced error format'); // Custom error format
console.debug('Debug format'); // Custom debug format
console.warn('Simple warning'); // Simplified format
```

## Advanced Usage

### Skip Separators on Empty Logs

By default, separators are skipped when a log is empty (no arguments or only whitespace). You can control this behavior:

```typescript
import { init } from 'loggatron';

init({
  separator: {
    preLog: '--------------------------------',
    postLog: '--------------------------------',
    skipOnEmptyLog: true, // Default: skip separators on empty logs
  },
});

console.log(); // No separators shown (no arguments)
console.log(''); // No separators shown (empty log)
console.log('   '); // No separators shown (only whitespace)
console.log('Actual message'); // Separators shown

// Override per method
init({
  separator: {
    skipOnEmptyLog: true, // Global default
  },
  overrides: {
    error: {
      separator: {
        skipOnEmptyLog: false, // Always show separators for errors, even if empty
      },
    },
  },
});
```

### Add Newline After Logs

Control whether to add an extra newline after each log:

```typescript
import { init } from 'loggatron';

init({
  addNewLine: true, // Add extra newline after each log
});

console.log('Message 1');
console.log('Message 2');
// Output will have extra spacing between logs

// Override per method
init({
  addNewLine: false, // Global default: no extra newline
  overrides: {
    info: {
      addNewLine: true, // Add newline only for info logs
    },
  },
});
```

### Custom Separator Colors

You can set different colors for separators (separate from log content colors):

```typescript
import { init } from 'loggatron';

init({
  separator: {
    preLog: '--------------------------------',
    postLog: '--------------------------------',
    color: '\x1b[90m', // Gray separators
  },
  colors: {
    log: '\x1b[36m', // Cyan for log content
  },
  // Separators will be gray, log content will be cyan
});

// Override separator color per method
init({
  separator: {
    color: '\x1b[97m', // White separators by default
  },
  overrides: {
    error: {
      separator: {
        color: '\x1b[91m', // Bright red separators for errors
      },
    },
  },
});
```

### Debug Stack Trace Parsing

Enable debug logging to troubleshoot context extraction issues:

```typescript
import { init } from 'loggatron';

init({
  debug: true, // Enable debug logging
});

console.log('Test');
// Will output detailed information about stack trace parsing:
// [Loggatron Debug] Full stack trace:
//   [0] Error
//   [1]     at Loggatron.captureContext (...)
//   ...
// [Loggatron Debug] Examining line 4: "..."
// [Loggatron Debug] Match found:
//   - name: "functionName"
//   - filePath: "path/to/file.ts"
//   ...
```

### Update Configuration Dynamically

```typescript
import { configure } from 'loggatron';

// Update configuration at runtime
configure({
  enabled: false, // Disable temporarily
});

// Re-enable
configure({
  enabled: true,
});
```

### Destroy and Restore Original Console

```typescript
import { destroy } from 'loggatron';

destroy(); // Restores original console methods
```

### Access Instance (Advanced)

```typescript
import { getInstance } from 'loggatron';

const instance = getInstance();
if (instance) {
  // Access the Loggatron instance directly
  // Note: The instance type is not exported, but you can use it via getInstance()
}
```

## Configuration Options

### Global Configuration

| Option                     | Type          | Default                                 | Description                                                                                                   |
| -------------------------- | ------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `enabled`                  | `boolean`     | `true`                                  | Enable/disable the logger                                                                                     |
| `separator.preLog`         | `string`      | `"--------------------------------"`    | Text before each log                                                                                          |
| `separator.postLog`        | `string`      | `"--------------------------------"`    | Text after each log                                                                                           |
| `separator.color`          | `string`      | `'\x1b[97m'`                            | ANSI color code for separators (Bright White)                                                                 |
| `separator.skipOnEmptyLog` | `boolean`     | `true`                                  | Skip separators when log is empty                                                                             |
| `showFileName`             | `boolean`     | `true`                                  | Show file name and line number                                                                                |
| `showFunctionName`         | `boolean`     | `true`                                  | Show function/component name                                                                                  |
| `addNewLine`               | `boolean`     | `false`                                 | Add extra newline after each log                                                                              |
| `colors.log`               | `string`      | `'\x1b[36m'`                            | ANSI color code for log (Cyan)                                                                                |
| `colors.info`              | `string`      | `'\x1b[32m'`                            | ANSI color code for info (Green)                                                                              |
| `colors.warn`              | `string`      | `'\x1b[33m'`                            | ANSI color code for warn (Yellow)                                                                             |
| `colors.error`             | `string`      | `'\x1b[31m'`                            | ANSI color code for error (Red)                                                                               |
| `colors.debug`             | `string`      | `'\x1b[35m'`                            | ANSI color code for debug (Magenta)                                                                           |
| `emojis.log`               | `string`      | `'📝'`                                  | Emoji for log                                                                                                 |
| `emojis.info`              | `string`      | `'ℹ️'`                                  | Emoji for info                                                                                                |
| `emojis.warn`              | `string`      | `'⚠️'`                                  | Emoji for warn                                                                                                |
| `emojis.error`             | `string`      | `'❌'`                                  | Emoji for error                                                                                               |
| `emojis.debug`             | `string`      | `'🐛'`                                  | Emoji for debug                                                                                               |
| `methods`                  | `LogMethod[]` | `['log','info','warn','error','debug']` | Console methods to intercept                                                                                  |
| `captureStack`             | `boolean`     | `true`                                  | Capture stack trace for context                                                                               |
| `maxStackDepth`            | `number`      | `3`                                     | Preferred stack frames to check (automatically searches deeper when needed, e.g., for React error boundaries) |
| `debug`                    | `boolean`     | `false`                                 | Enable debug logging for stack trace parsing (useful for troubleshooting context extraction)                  |

### Method-Specific Overrides (`overrides`)

Each method can override these specific options:

```typescript
overrides: {
  log?: {
    separator?: {
      preLog?: string;
      postLog?: string;
      color?: string; // Custom color for this method's separators
      skipOnEmptyLog?: boolean; // Skip separators on empty logs for this method
    };
    showFileName?: boolean;
    showFunctionName?: boolean;
    addNewLine?: boolean; // Override global addNewLine for this method
  };
  // ... same for info, warn, error, debug
}
```

**Note**:

- Override values take precedence over global values. If an override option is `undefined`, it falls back to the global setting.
- **Colors and emojis cannot be overridden per method** - they are set globally via `colors` and `emojis` configuration options.
- Each method uses its own color and emoji from the global `colors` and `emojis` configuration (e.g., `colors.error` for `console.error`, `emojis.info` for `console.info`).

## Removing Console.log in Production Builds

### Vite

Add to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger'], // Removes all console.* calls
    },
  },
});
```

Or for more control with Terser (`vite` already bundles `terser`):

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove all console.*
        // Or selective: drop_console: ['log', 'info'], // Keep warn and error
      },
    },
  },
});
```

### Webpack

In your `webpack.config.js`:

```javascript
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  // ... other configurations ...
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // Remove all console.*
            // Or selective: drop_console: ['log', 'info'],
          },
        },
      }),
    ],
  },
};
```

### Rollup

```javascript
import terser from '@rollup/plugin-terser';

export default {
  plugins: [
    terser({
      compress: {
        drop_console: true,
      },
    }),
  ],
};
```

### Using Babel Plugin

```bash
npm install --save-dev babel-plugin-transform-remove-console
```

In your `.babelrc` or `babel.config.js`:

```json
{
  "plugins": [
    [
      "transform-remove-console",
      {
        "exclude": ["error", "warn"] // Keep error and warn
      }
    ]
  ]
}
```

## Tree-Shaking

This package is fully tree-shakeable. If you only import what you need, unused code will be removed:

```typescript
// Only imports init function - tree-shakeable
import { init } from 'loggatron';

// Instead of importing everything
import * as loggatron from 'loggatron'; // Not recommended
```

Make sure your bundler supports tree-shaking and that `sideEffects: false` is respected.

## ANSI Color Codes Reference

You can customize colors using ANSI escape codes:

- `'\x1b[30m'` - Black
- `'\x1b[31m'` - Red
- `'\x1b[32m'` - Green
- `'\x1b[33m'` - Yellow
- `'\x1b[34m'` - Blue
- `'\x1b[35m'` - Magenta
- `'\x1b[36m'` - Cyan
- `'\x1b[37m'` - White
- `'\x1b[90m'` - Bright Black (Gray)
- `'\x1b[91m'` - Bright Red
- `'\x1b[92m'` - Bright Green
- `'\x1b[93m'` - Bright Yellow
- `'\x1b[94m'` - Bright Blue
- `'\x1b[95m'` - Bright Magenta
- `'\x1b[96m'` - Bright Cyan
- `'\x1b[97m'` - Bright White
- `'\x1b[0m'` - Reset (automatically added)

## Error Handling

Loggatron intelligently handles various error scenarios:

- **Inline Context**: Error messages and context (emoji + location) appear together on the same line for better readability
- **Multi-line Errors**: React error boundaries and other multi-line error messages are handled gracefully, with context prepended only to the first line
- **Deep Stack Search**: When errors originate from library code (e.g., React internals), Loggatron automatically searches deeper in the stack trace to find your application code and display proper context

```typescript
// React error boundary errors will show proper context even when called from React internals
console.error('Error occurred');
// Output: ❌ [YourComponent] (YourComponent.tsx:42) Error occurred

// Multi-line errors (like React component stack traces) are handled cleanly
console.error(
  'The above error occurred in the <Component> component:\n    at Component (...)\n    ...'
);
// Output: ❌ The above error occurred in the <Component> component:
//            at Component (...)
//            ...
```

## Browser Support

Works in both Node.js and browser environments. Colors work in terminals that support ANSI codes. In browser DevTools, colors may not display unless the browser supports ANSI color codes in console output.

## API Reference

### `init(config?: LoggatronConfig): Loggatron`

Initializes Loggatron with optional configuration. Call this once in your main application file.

```typescript
const logger = init({
  enabled: true,
  separator: { preLog: '===', postLog: '===' },
});
```

### `configure(config: LoggatronConfig): void`

Updates the configuration of an existing Loggatron instance. If no instance exists, it will be created.

```typescript
configure({ enabled: false });
```

### `destroy(): void`

Destroys the Loggatron instance and restores original console methods.

```typescript
destroy();
```

### `getInstance(): Loggatron | null`

Returns the current Loggatron instance, or `null` if not initialized.

```typescript
const instance = getInstance();
```

### `Loggatron` (Class)

The `Loggatron` class is not exported from the main entry point to keep the API surface minimal. Use the `init()`, `configure()`, `destroy()`, and `getInstance()` functions instead for all use cases.

## Examples

### React Application

```typescript
// main.tsx
import { init } from 'loggatron';

init({
  addNewLine: true, // Add spacing between logs
  overrides: {
    info: {
      separator: { preLog: '', postLog: '' },
      showFileName: false,
      showFunctionName: true,
    },
  },
});

// Component.tsx
export function MyComponent() {
  console.log('Component rendered'); // Full format
  console.info('User action'); // Minimal format
  return <div>Hello</div>;
}
```

### Node.js Application

```typescript
// app.ts
import { init } from 'loggatron';

init({
  separator: {
    preLog: '┌─────────────────────────────',
    postLog: '└─────────────────────────────',
    color: '\x1b[90m', // Gray for separators
  },
  addNewLine: true, // Add spacing for better readability
  overrides: {
    error: {
      separator: {
        preLog: '❌ ERROR ───────────────────',
        postLog: '─────────────────────────────',
        color: '\x1b[91m', // Bright Red for error separators
      },
    },
  },
});

console.log('Server starting...');
console.error('Database connection failed');
```

### Disable for Specific Environments

```typescript
import { init } from 'loggatron';

init({
  enabled: process.env.NODE_ENV !== 'production',
  // In production, logger is disabled but you can still remove console.log via build tools
});
```

## Contributing & Releasing

### Local development

```bash
git clone https://github.com/Raycas96/loggatron.git
cd loggatron
npm install        # also runs `husky` to install git hooks
npm run dev        # tsdown in watch mode
npm run typecheck  # tsc --noEmit
npm run lint       # eslint src
npm run test       # vitest run
npm run build      # tsdown -> dist/
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org) — enforced via `commitlint` on `commit-msg`. `lint-staged` runs Prettier + ESLint on staged files in `pre-commit`.

### Releasing (Changesets)

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing — there is no manual `npm publish`. Releases happen automatically from the `main` branch via the [`Release` workflow](./.github/workflows/release.yml).

The flow is:

1. **Add a changeset** alongside any user-facing change:

   ```bash
   npx changeset
   ```

   Pick `patch` / `minor` / `major`, write a short summary. Commit the generated `.changeset/*.md` file with the rest of your PR.

2. **Merge your PR** to `main`. The `Release` workflow runs and either:
   - opens (or updates) a `Version Packages` PR that bumps the version and updates `CHANGELOG.md`, **or**
   - publishes to npm (if a `Version Packages` PR was just merged).

3. **Merging the `Version Packages` PR** triggers the publish on the next `main` workflow run.

Publishing uses **npm Trusted Publishing (OIDC)** — no `NPM_TOKEN` is stored. The package is published with [npm provenance](https://docs.npmjs.com/generating-provenance-statements) attached.

### Skipping a release

The `Release` workflow also runs lint/test/build on every push to `main` for early failure detection. To gate the actual publish/version step:

| When                                               | How                                                       |
| -------------------------------------------------- | --------------------------------------------------------- |
| You want the **whole workflow** skipped            | Include `[skip ci]` in the commit message (GitHub native) |
| You want CI to run but **no version PR / publish** | Include `[skip release]` in the commit message            |
| You want a **manual dry-run** of the workflow      | Trigger via `workflow_dispatch` with `dry_run: true`      |

In the latter two cases, install/typecheck/lint/test/build still run as a sanity check; only the `changesets/action` step is skipped.

## Changelog

All notable changes to this project are documented in [CHANGELOG.md](./CHANGELOG.md).

## License

[MIT](./LICENSE) © Raycas96
