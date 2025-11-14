import { LoggatronConfig, LogMethod, MergedMethodConfig } from './types';
import { DEFAULT_CONFIG } from './constants';
import { mergeConfig } from './utils/config';
import { parseStackTrace } from './utils/stack-trace';
import { formatLog } from './formatters/log-formatter';

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
      ...mergeConfig(config),
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

  public configure(config: LoggatronConfig): void {
    this.config = {
      ...this.config,
      ...mergeConfig(config),
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
    const context = parseStackTrace(
      {
        captureStack: this.config.captureStack,
        maxStackDepth: this.config.maxStackDepth,
        debug: this.config.debug,
      },
      this.originalConsole
    );

    formatLog(
      method,
      args,
      methodConfig,
      context,
      {
        colors: this.config.colors as Record<LogMethod, string>,
        emojis: this.config.emojis as Record<LogMethod, string>,
      },
      {
        originalConsole: this.originalConsole,
        originalMethod,
      }
    );
  }
}
