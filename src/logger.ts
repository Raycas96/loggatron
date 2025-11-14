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
    // If disabled, just pass through to original method
    if (!this.config.enabled) {
      originalMethod(...args);
      return;
    }

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

    // Combine context info with actual log content
    if (contextParts.length > 0 && args.length > 0) {
      // Prepend context to the first argument so they appear together
      const contextString = contextParts.join(' ');
      const firstArg = args[0];

      if (typeof firstArg === 'string') {
        // If first arg is a multi-line string (like React error boundaries),
        // prepend context only to the first line to keep formatting clean
        if (firstArg.includes('\n')) {
          const lines = firstArg.split('\n');
          const firstLineWithContext = `${contextString} ${lines[0]}`;
          const restOfLines = lines.slice(1).join('\n');
          originalMethod(`${firstLineWithContext}\n${restOfLines}`, ...args.slice(1));
        } else {
          // Single-line string: prepend context normally
          originalMethod(`${contextString} ${firstArg}`, ...args.slice(1));
        }
      } else if (firstArg instanceof Error) {
        // If first arg is an Error, prepend context to the error message
        const errorWithContext = new Error(`${contextString} ${firstArg.message}`);
        errorWithContext.stack = firstArg.stack;
        errorWithContext.name = firstArg.name;
        originalMethod(errorWithContext, ...args.slice(1));
      } else {
        // For other types, combine as separate arguments
        originalMethod(contextString, ...args);
      }
    } else if (contextParts.length > 0) {
      // Only context, no content
      originalMethod(contextParts.join(' '));
    } else if (args.length > 0) {
      // Only content, no context
      originalMethod(...args);
    }

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
        if (this.config.debug) {
          this.originalConsole.log('[Loggatron Debug] No stack trace available');
        }
        return {};
      }

      const stackLines = stack.split('\n');

      if (this.config.debug) {
        this.originalConsole.log('[Loggatron Debug] Full stack trace:');
        stackLines.forEach((line, idx) => {
          this.originalConsole.log(`  [${idx}] ${line}`);
        });
      }

      // Skip the first 4 lines: Error, captureContext, log, console.<computed>
      const skipLines = 4;
      const maxDepth = this.config.maxStackDepth || 3;
      // When all initial frames are internal (e.g., React error boundaries),
      // we need to search deeper. Use a larger search window but still respect maxDepth preference.
      const searchDepth = Math.max(maxDepth * 2, 10);
      const relevantLines = stackLines.slice(skipLines, skipLines + searchDepth);

      if (this.config.debug) {
        this.originalConsole.log(
          `[Loggatron Debug] Skipping first ${skipLines} lines, examining next ${searchDepth} lines:`
        );
        relevantLines.forEach((line, idx) => {
          this.originalConsole.log(`  [${skipLines + idx}] ${line}`);
        });
      }

      for (let i = 0; i < relevantLines.length; i++) {
        const line = relevantLines[i];

        if (this.config.debug) {
          this.originalConsole.log(`[Loggatron Debug] Examining line ${skipLines + i}: "${line}"`);
        }

        // Match browser format: at functionName (file:///path/to/file.js:line:column)
        // or Node.js format: at functionName (/path/to/file.js:line:column)
        const withParenthesesMatch = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);

        // Match: at file:line:column (no function name, no parentheses)
        const simpleMatch = line.match(/at\s+(.+?):(\d+):(\d+)$/);

        // Also match: functionName @ file:line format (browser format without "at")
        const atSymbolMatch = line.match(/^(.+?)\s+@\s+(.+?):(\d+)(?::(\d+))?$/);

        let name: string;
        let filePath: string;
        let lineNumber: number;
        let columnNumber: number;

        if (atSymbolMatch) {
          // Handle functionName @ file:line format
          name = atSymbolMatch[1].trim();
          filePath = atSymbolMatch[2].trim();
          lineNumber = parseInt(atSymbolMatch[3], 10);
          columnNumber = atSymbolMatch[4] ? parseInt(atSymbolMatch[4], 10) : 0;
        } else if (withParenthesesMatch) {
          // Handle: at functionName (file:line:column)
          name = withParenthesesMatch[1].trim();
          filePath = withParenthesesMatch[2].trim();
          lineNumber = parseInt(withParenthesesMatch[3], 10);
          columnNumber = parseInt(withParenthesesMatch[4], 10);
        } else if (simpleMatch) {
          // Handle: at file:line:column (no function name, no parentheses)
          name = 'anonymous';
          filePath = simpleMatch[1].trim();
          lineNumber = parseInt(simpleMatch[2], 10);
          columnNumber = parseInt(simpleMatch[3], 10);
        } else {
          // No match found
          if (this.config.debug) {
            this.originalConsole.log(`[Loggatron Debug] No match found for line: "${line}"`);
          }
          continue;
        }

        if (this.config.debug) {
          this.originalConsole.log(`[Loggatron Debug] Match found:`);
          this.originalConsole.log(`  - name: "${name}"`);
          this.originalConsole.log(`  - filePath: "${filePath}"`);
          this.originalConsole.log(`  - lineNumber: ${lineNumber}`);
          this.originalConsole.log(`  - columnNumber: ${columnNumber}`);
        }

        // Skip internal files and node_modules
        if (
          filePath.includes('node_modules') ||
          filePath.includes('loggatron') ||
          filePath.includes('Logger.ts') ||
          filePath.includes('logger.ts') ||
          filePath.includes('index.ts') ||
          name.includes('loggatron') ||
          name.includes('Loggatron')
        ) {
          if (this.config.debug) {
            this.originalConsole.log(`[Loggatron Debug] Skipping internal file: "${filePath}"`);
          }
          continue;
        }

        const fileName = this.extractFileName(filePath);
        const functionName = this.extractFunctionName(name, filePath);

        if (this.config.debug) {
          this.originalConsole.log(`[Loggatron Debug] Extracted context:`);
          this.originalConsole.log(`  - fileName: "${fileName}"`);
          this.originalConsole.log(`  - functionName: "${functionName}"`);
          this.originalConsole.log(`  - lineNumber: ${lineNumber}`);
          this.originalConsole.log(`  - columnNumber: ${columnNumber}`);
        }

        return {
          fileName,
          functionName: functionName,
          lineNumber,
          columnNumber,
        };
      }

      if (this.config.debug) {
        this.originalConsole.log('[Loggatron Debug] No valid context found in stack trace');
      }
    } catch (e) {
      if (this.config.debug) {
        this.originalConsole.error('[Loggatron Debug] Error capturing context:', e);
      }
      // Silent fail if stack capture fails
    }

    return {};
  }

  private extractFileName(filePath: string): string {
    if (this.config.debug) {
      this.originalConsole.log(`[Loggatron Debug] extractFileName input: "${filePath}"`);
    }

    // Remove query strings and hashes
    const cleanPath = filePath.split('?')[0].split('#')[0];

    // Extract just the filename
    const parts = cleanPath.split(/[/\\]/);
    const fileName = parts[parts.length - 1] || cleanPath;

    if (this.config.debug) {
      this.originalConsole.log(`[Loggatron Debug] extractFileName output: "${fileName}"`);
    }

    return fileName;
  }

  private extractFunctionName(functionName: string, filePath: string): string {
    if (this.config.debug) {
      this.originalConsole.log(
        `[Loggatron Debug] extractFunctionName input: functionName="${functionName}", filePath="${filePath}"`
      );
    }

    if (functionName.startsWith('http://') || functionName.startsWith('https://')) {
      // remove protocol, domain, port and query string
      const cleanedFunctionName = functionName
        .replace(/^https?:\/\//, '')
        .replace(/^([^/]+)(:\d+)?\//, '$1/')
        .split('?')[0];

      if (cleanedFunctionName.length > 0) {
        let result: string;
        if (cleanedFunctionName.includes('/')) {
          result = cleanedFunctionName.split('/').at(-1) || '';
        } else {
          result = cleanedFunctionName;
        }

        if (this.config.debug) {
          this.originalConsole.log(
            `[Loggatron Debug] extractFunctionName (URL) output: "${result}"`
          );
        }
        return result;
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
      if (this.config.debug) {
        this.originalConsole.log(
          `[Loggatron Debug] extractFunctionName (meaningful) output: "${functionName}"`
        );
      }
      return functionName;
    }

    // Otherwise try to extract from file path
    const fileName = this.extractFileName(filePath);
    const nameWithoutExt = fileName.split('.')[0];

    // Capitalize first letter if it's lowercase (common component pattern)
    let result = 'Unknown';
    if (nameWithoutExt && nameWithoutExt.length > 0) {
      result = nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1);
    }

    if (this.config.debug) {
      this.originalConsole.log(
        `[Loggatron Debug] extractFunctionName (from file) output: "${result}"`
      );
    }

    return result;
  }
}
