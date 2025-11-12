import { LogContext, LoggatronConfig, LogMethod, MergedMethodConfig } from './types';
import { DEFAULT_CONFIG } from './constants';
import { RESET_COLOR } from './constants';

let isInitialized = false;

export class Loggatron {
  private config: Required<Omit<LoggatronConfig, 'overrides'>> & {
    overrides?: LoggatronConfig['overrides'];
  };

  private originalConsole: {
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
    debug: typeof console.debug;
  };

  constructor(config: LoggatronConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...this.mergeConfig(config),
      overrides: config.overrides,
    };
    this.originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
    };
  }

  private mergeConfig(
    config: LoggatronConfig
  ): Partial<Required<Omit<LoggatronConfig, 'overrides'>>> {
    return {
      ...config,
      separator: {
        ...DEFAULT_CONFIG.separator,
        ...config.separator,
      },
      colors: { ...DEFAULT_CONFIG.colors, ...config.colors },
      emojis: { ...DEFAULT_CONFIG.emojis, ...config.emojis },
    };
  }

  public configure(config: LoggatronConfig): void {
    this.config = {
      ...this.config,
      ...this.mergeConfig(config),
      overrides: { ...this.config.overrides, ...config.overrides },
    };
  }

  public init(): void {
    if (isInitialized) {
      return;
    }

    if (!this.config.enabled) {
      return;
    }

    const methods = this.config.methods || DEFAULT_CONFIG.methods;

    methods.forEach((method) => {
      const originalMethod = this.originalConsole[method];
      console[method] = (...args: unknown[]) => {
        this.log(method as LogMethod, args, originalMethod);
      };
    });

    isInitialized = true;
  }

  public destroy(): void {
    if (!isInitialized) {
      return;
    }

    console.log = this.originalConsole.log;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.debug = this.originalConsole.debug;

    isInitialized = false;
  }

  private getMethodConfig(method: LogMethod): MergedMethodConfig {
    // Ensure separator always has default values merged
    const globalSeparator = {
      ...DEFAULT_CONFIG.separator,
      ...this.config.separator,
    };

    const globalConfig: MergedMethodConfig = {
      separator: globalSeparator,
      showFileName: this.config.showFileName ?? DEFAULT_CONFIG.showFileName,
      showFunctionName: this.config.showFunctionName ?? DEFAULT_CONFIG.showFunctionName,
      addNewLine: this.config.addNewLine ?? DEFAULT_CONFIG.addNewLine,
    };

    const override = this.config.overrides?.[method];
    if (!override) {
      return globalConfig;
    }

    // Merge override with global config
    return {
      separator: {
        preLog:
          override.separator?.preLog !== undefined
            ? override.separator.preLog
            : globalConfig.separator.preLog,
        postLog:
          override.separator?.postLog !== undefined
            ? override.separator.postLog
            : globalConfig.separator.postLog,
        color:
          override.separator?.color !== undefined
            ? override.separator.color
            : globalConfig.separator.color,
        skipOnEmptyLog:
          override.separator?.skipOnEmptyLog !== undefined
            ? override.separator.skipOnEmptyLog
            : globalConfig.separator.skipOnEmptyLog,
      },
      showFileName:
        override.showFileName !== undefined ? override.showFileName : globalConfig.showFileName,
      showFunctionName:
        override.showFunctionName !== undefined
          ? override.showFunctionName
          : globalConfig.showFunctionName,
      addNewLine: override.addNewLine !== undefined ? override.addNewLine : globalConfig.addNewLine,
    };
  }

  private log(method: LogMethod, args: unknown[], originalMethod: typeof console.log): void {
    const methodConfig = this.getMethodConfig(method);
    const context = this.captureContext();
    const { separator, showFileName, showFunctionName } = methodConfig;
    const separatorColor = separator.color;
    const color = this.config.colors[method]!;
    const emoji = this.config.emojis[method]!;
    const reset = RESET_COLOR;
    const isEmptyLog =
      args.length === 0 ||
      (args.length === 1 && typeof args[0] === 'string' && args[0].trim() === '');

    const shouldSkipSeparator = separator.skipOnEmptyLog && isEmptyLog;

    // Pre-log separator
    const preLogParts: string[] = [];
    if (separator.preLog && !shouldSkipSeparator) {
      preLogParts.push(`${separatorColor}${separator.preLog}${reset}`);
    }

    // Context info
    const contextParts: string[] = [];
    if (emoji) {
      contextParts.push(`${color}${emoji}${reset}`);
    }

    if (showFunctionName && context.functionName) {
      contextParts.push(`${color}[${context.functionName}]${reset}`);
    }

    if (showFileName && context.fileName) {
      const location = context.lineNumber
        ? `${context.fileName}:${context.lineNumber}`
        : context.fileName;
      contextParts.push(`${color}(${location})${reset}`);
    }

    // Post-log separator
    const postLogParts: string[] = [];
    if (separator.postLog && !shouldSkipSeparator) {
      postLogParts.push(`${separatorColor}${separator.postLog}${reset}`);
    }

    // Print pre-log separator
    if (preLogParts.length > 0) {
      this.originalConsole.log(preLogParts.join(' '));
    }

    // Print context info
    if (contextParts.length > 0) {
      originalMethod(contextParts.join(' '));
    }

    // Print actual log content
    originalMethod(...args);

    // Print post-log separator
    if (postLogParts.length > 0) {
      this.originalConsole.log(postLogParts.join(' '));
    }

    // Add spacing if enabled
    if (methodConfig.addNewLine) {
      this.originalConsole.log('');
    }
  }

  private captureContext(): LogContext {
    if (!this.config.captureStack) {
      return {};
    }

    try {
      const stack = new Error().stack;
      if (!stack) {
        return {};
      }

      const stackLines = stack.split('\n');
      // Skip the first 3 lines: Error, captureContext, log
      const relevantLines = stackLines.slice(4, 4 + (this.config.maxStackDepth || 3));

      for (const line of relevantLines) {
        // Match browser format: at functionName (file:///path/to/file.js:line:column)
        // or Node.js format: at functionName (/path/to/file.js:line:column)
        const browserMatch = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
        const nodeMatch = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
        const simpleMatch = line.match(/at\s+(.+?):(\d+):(\d+)/);

        const match = browserMatch || nodeMatch || simpleMatch;
        if (match) {
          const name = match[1] || 'anonymous';
          const filePath = match[2] || match[1];
          const lineNumber = parseInt(match[3] || match[2], 10);
          const columnNumber = parseInt(match[4] || match[3], 10);

          // Skip internal files and node_modules
          if (
            filePath.includes('node_modules') ||
            filePath.includes('loggatron') ||
            filePath.includes('Logger.ts') ||
            filePath.includes('index.ts')
          ) {
            continue;
          }

          const fileName = this.extractFileName(filePath);
          const functionName = this.extractFunctionName(name, filePath);

          return {
            fileName,
            functionName: functionName,
            lineNumber,
            columnNumber,
          };
        }
      }
    } catch (e) {
      // Silent fail if stack capture fails
    }

    return {};
  }

  private extractFileName(filePath: string): string {
    // Remove query strings and hashes
    const cleanPath = filePath.split('?')[0].split('#')[0];

    // Extract just the filename
    const parts = cleanPath.split(/[/\\]/);
    return parts[parts.length - 1] || cleanPath;
  }

  private extractFunctionName(functionName: string, filePath: string): string {
    if (functionName.startsWith('http://') || functionName.startsWith('https://')) {
      // remove protocol, domain port and query string
      const cleanedFunctionName = functionName
        .replace(/^https?:\/\//, '')
        .replace(/:\d+/, '')
        .split('?')[0];

      if (cleanedFunctionName.length > 0) {
        if (cleanedFunctionName.includes('/')) {
          return cleanedFunctionName.split('/').at(-1) || '';
        }

        return cleanedFunctionName;
      }
    }

    // If function name is meaningful, use it
    if (
      functionName &&
      functionName !== 'anonymous' &&
      !functionName.startsWith('Object.') &&
      !functionName.includes('.') &&
      // Should contain at least one letter.
      functionName.match(/[a-zA-Z]/)
    ) {
      return functionName;
    }

    // Otherwise try to extract from file path
    const fileName = this.extractFileName(filePath);
    const nameWithoutExt = fileName.split('.')[0];

    // Capitalize first letter if it's lowercase (common component pattern)
    if (nameWithoutExt && nameWithoutExt.length > 0) {
      return nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1);
    }

    return 'Unknown';
  }
}
