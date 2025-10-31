# Loggatron

A tree-shakeable, configurable logger that intercepts console methods with beautiful separators, colors, emojis, and context information. Configure once and enhance all your console logs with automatic file/component detection and method-specific customization.

## Why Loggatron?

This package was created not because existing logging solutions are inadequate, but because none of them perfectly matched the specific requirements I was looking for. I needed a logger that:

- Intercepts console methods automatically (no need to replace every `console.log`)
- Provides configurable separators before and after each log
- Supports method-specific overrides (different formats for `log`, `info`, `error`, etc.)
- Automatically detects file names, line numbers, and component names
- Is tree-shakeable and production-ready
- Works seamlessly with build tools to remove console statements in production

While there are excellent logging packages available, I couldn't find one that combined all these features exactly as I needed them. So I decided to create Loggatron to fill that gap. If you have similar requirements, this package might be perfect for you too!

## Features

- 🌳 **Tree-shakeable**: Only import what you use
- 🎨 **Highly Configurable**: Separators, colors, emojis, and method-specific overrides
- 📍 **Context-aware**: Automatically shows file name, line number, and component name
- 🔧 **Method Overrides**: Different formatting for each console method (log, info, warn, error, debug)
- 🌐 **Universal**: Works in Node.js and browser environments
- 🚀 **Production-ready**: Easy to remove all console.log in production builds
- 🎯 **Zero Dependencies**: Lightweight with no runtime dependencies

## Installation

```bash
npm install loggatron
```

## Quick Start

```typescript
import { init } from 'loggatron';

// Initialize once in your main file
init();

// Now all console.log calls will be enhanced
console.log('Hello World');
// Output:
// =========================== 📝 [MyComponent] (index.ts:42)
// Hello World
// ===========================
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
  showComponentName: true,
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
    preLog: '===========================',
    postLog: '===========================',
  },
  showFileName: true,
  showComponentName: true,

  // Method-specific overrides
  overrides: {
    info: {
      separator: {
        preLog: '', // No separator for info
        postLog: '', // Clean output
      },
      showFileName: false, // Don't show file name for info
      showComponentName: true, // But still show component name
      emoji: '💡', // Custom emoji for info
    },
    error: {
      separator: {
        preLog: '🚨🚨🚨 ERROR 🚨🚨🚨',
        postLog: '━━━━━━━━━━━━━━━━━━━━━━━━',
      },
      showFileName: true,
      showComponentName: true,
      emoji: '🔥', // Custom emoji
    },
    debug: {
      separator: {
        preLog: '🐛 DEBUG START 🐛',
        postLog: '🐛 DEBUG END 🐛',
      },
      showFileName: true,
      showComponentName: false, // Hide component name for debug
    },
    warn: {
      showFileName: false, // Simple warning format
      showComponentName: true,
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
import { getInstance, Loggatron } from 'loggatron';

const instance = getInstance();
if (instance) {
  // Access the Loggatron instance directly
}

// Or create your own instance
import { Loggatron } from 'loggatron';
const customLogger = new Loggatron({
  // custom config
});
customLogger.init();
```

## Configuration Options

### Global Configuration

| Option              | Type          | Default                                 | Description                         |
| ------------------- | ------------- | --------------------------------------- | ----------------------------------- |
| `enabled`           | `boolean`     | `true`                                  | Enable/disable the logger           |
| `separator.preLog`  | `string`      | `"==========================="`         | Text before each log                |
| `separator.postLog` | `string`      | `"==========================="`         | Text after each log                 |
| `showFileName`      | `boolean`     | `true`                                  | Show file name and line number      |
| `showComponentName` | `boolean`     | `true`                                  | Show component/function name        |
| `colors.log`        | `string`      | `'\x1b[36m'`                            | ANSI color code for log (Cyan)      |
| `colors.info`       | `string`      | `'\x1b[32m'`                            | ANSI color code for info (Green)    |
| `colors.warn`       | `string`      | `'\x1b[33m'`                            | ANSI color code for warn (Yellow)   |
| `colors.error`      | `string`      | `'\x1b[31m'`                            | ANSI color code for error (Red)     |
| `colors.debug`      | `string`      | `'\x1b[35m'`                            | ANSI color code for debug (Magenta) |
| `emojis.log`        | `string`      | `'📝'`                                  | Emoji for log                       |
| `emojis.info`       | `string`      | `'ℹ️'`                                  | Emoji for info                      |
| `emojis.warn`       | `string`      | `'⚠️'`                                  | Emoji for warn                      |
| `emojis.error`      | `string`      | `'❌'`                                  | Emoji for error                     |
| `emojis.debug`      | `string`      | `'🐛'`                                  | Emoji for debug                     |
| `methods`           | `LogMethod[]` | `['log','info','warn','error','debug']` | Console methods to intercept        |
| `captureStack`      | `boolean`     | `true`                                  | Capture stack trace for context     |
| `maxStackDepth`     | `number`      | `3`                                     | Maximum stack frames to check       |

### Method-Specific Overrides (`overrides`)

Each method can override any of these options:

```typescript
overrides: {
  log?: {
    separator?: { preLog?: string; postLog?: string };
    showFileName?: boolean;
    showComponentName?: boolean;
    color?: string;
    emoji?: string;
  };
  // ... same for info, warn, error, debug
}
```

**Note**: Override values take precedence over global values. If an override option is `undefined`, it falls back to the global setting.

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

Or for more control with Terser:

```typescript
import { defineConfig } from 'vite';
import { terser } from 'rollup-plugin-terser';

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
import { terser } from 'rollup-plugin-terser';

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
- `'\x1b[0m'` - Reset (automatically added)

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

For advanced usage, you can create your own Loggatron instance:

```typescript
import { Loggatron } from 'loggatron';

const logger = new Loggatron({
  // config
});
logger.init();
logger.destroy();
```

## Examples

### React Application

```typescript
// main.tsx
import { init } from 'loggatron';

init({
  overrides: {
    info: {
      separator: { preLog: '', postLog: '' },
      showFileName: false,
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
  },
  overrides: {
    error: {
      separator: {
        preLog: '❌ ERROR ───────────────────',
        postLog: '─────────────────────────────',
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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Related Packages

- `console-log-interceptor` - Basic console interception
- `console-interceptor` - Proxy-based interception
- `tslog` - Full-featured TypeScript logger
- `minilog` - Lightweight logging library
