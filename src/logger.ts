import { LoggatronConfig, LogMethod, MergedMethodConfig, MethodOverrideConfig } from './types';
import { DEFAULT_CONFIG } from './constants';
import { RESET_COLOR } from './constants';

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

  private isInitialized: boolean = false;

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
    if (this.isInitialized) {
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

    this.isInitialized = true;
  }

  public destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    console.log = this.originalConsole.log;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.debug = this.originalConsole.debug;

    this.isInitialized = false;
  }

  private getMethodConfig(method: LogMethod): MergedMethodConfig {
    const globalConfig: MergedMethodConfig = {
      separator: this.config.separator,
      showFileName: this.config.showFileName,
      showComponentName: this.config.showComponentName,
      color: this.config.colors[method]!,
      emoji: this.config.emojis[method]!,
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
      },
      showFileName:
        override.showFileName !== undefined ? override.showFileName : globalConfig.showFileName,
      showComponentName:
        override.showComponentName !== undefined
          ? override.showComponentName
          : globalConfig.showComponentName,
      color: override.color ?? globalConfig.color,
      emoji: override.emoji ?? globalConfig.emoji,
    };
  }

  private log(method: LogMethod, args: unknown[], originalMethod: typeof console.log): void {
    const methodConfig = this.getMethodConfig(method);
    const context = this.captureContext();
    const { color, emoji, separator, showFileName, showComponentName } = methodConfig;
    const reset = RESET_COLOR;

    // Pre-log separator
    const preLogParts: string[] = [];
    if (separator.preLog) {
      preLogParts.push(`${color}${separator.preLog}${reset}`);
    }

    // Context info
    const contextParts: string[] = [];
    if (emoji) {
      contextParts.push(`${color}${emoji}${reset}`);
    }

    if (showComponentName && context.componentName) {
      contextParts.push(`${color}[${context.componentName}]${reset}`);
    }

    if (showFileName && context.fileName) {
      const location = context.lineNumber
        ? `${context.fileName}:${context.lineNumber}`
        : context.fileName;
      contextParts.push(`${color}(${location})${reset}`);
    }

    // Post-log separator
    const postLogParts: string[] = [];
    if (separator.postLog) {
      postLogParts.push(`${color}${separator.postLog}${reset}`);
    }

    // Print pre-log separator
    if (preLogParts.length > 0) {
      originalMethod(preLogParts.join(' '));
    }

    // Print context info
    if (contextParts.length > 0) {
      originalMethod(contextParts.join(' '));
    }

    // Print actual log content
    originalMethod(...args);

    // Print post-log separator
    if (postLogParts.length > 0) {
      originalMethod(postLogParts.join(' '));
    }

    // Add spacing
    originalMethod('');
  }

  private captureContext(): import('./types').LogContext {
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
          const functionName = match[1] || 'anonymous';
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
          const componentName = this.extractComponentName(functionName, filePath);

          return {
            fileName,
            componentName,
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

  private extractComponentName(functionName: string, filePath: string): string {
    // If function name is meaningful, use it
    if (
      functionName &&
      functionName !== 'anonymous' &&
      !functionName.startsWith('Object.') &&
      !functionName.includes('.')
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
