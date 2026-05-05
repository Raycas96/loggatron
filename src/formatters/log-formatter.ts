import { LogMethod, MergedMethodConfig, LogContext } from '../types';
import { RESET_COLOR } from '../constants';

interface FormatterConfig {
  colors: Record<LogMethod, string>;
  emojis: Record<LogMethod, string>;
}

interface ConsoleLike {
  log: (...args: unknown[]) => void;
}

interface FormatterDependencies {
  originalConsole: ConsoleLike;
  originalMethod: typeof console.log;
}

const isEmptyLog = (args: unknown[]): boolean =>
  args.length === 0 || (args.length === 1 && typeof args[0] === 'string' && args[0].trim() === '');

const formatSeparator = (separatorText: string | undefined, color: string): string | null => {
  if (!separatorText) {
    return null;
  }
  return `${color}${separatorText}${RESET_COLOR}`;
};

function buildContextParts(
  context: LogContext,
  methodConfig: MergedMethodConfig,
  config: FormatterConfig,
  method: LogMethod
): string[] {
  const contextParts: string[] = [];
  const color = config.colors[method];
  const emoji = config.emojis[method];

  if (emoji) {
    contextParts.push(`${color}${emoji}${RESET_COLOR}`);
  }

  if (methodConfig.showFunctionName && context.functionName) {
    contextParts.push(`${color}[${context.functionName}]${RESET_COLOR}`);
  }

  if (methodConfig.showFileName && context.fileName) {
    const location = context.lineNumber
      ? `${context.fileName}:${context.lineNumber}`
      : context.fileName;
    contextParts.push(`${color}(${location})${RESET_COLOR}`);
  }

  return contextParts;
}

function buildMainMessageArgs(contextString: string, args: unknown[]): unknown[] {
  const firstArg = args[0];

  if (typeof firstArg === 'string') {
    if (firstArg.includes('\n')) {
      const lines = firstArg.split('\n');
      const firstLineWithContext = `${contextString} ${lines[0]}`;
      const restOfLines = lines.slice(1).join('\n');
      return [`${firstLineWithContext}\n${restOfLines}`, ...args.slice(1)];
    }
    return [`${contextString} ${firstArg}`, ...args.slice(1)];
  }

  if (firstArg instanceof Error) {
    const message = `${contextString} ${firstArg.message}`;
    const errorWithContext = new Error(message);
    Object.assign(errorWithContext, firstArg, {
      message,
      stack: firstArg.stack,
      name: firstArg.name,
    });
    return [errorWithContext, ...args.slice(1)];
  }

  return [contextString, ...args];
}

/**
 * Formats and outputs a log message with context, separators, and proper handling
 * of multi-line strings and Error objects
 */
export function formatLog(
  method: LogMethod,
  args: unknown[],
  methodConfig: MergedMethodConfig,
  context: LogContext,
  config: FormatterConfig,
  deps: FormatterDependencies
): void {
  const { separator } = methodConfig;
  const separatorColor = separator.color || '';

  const shouldSkipSeparator = separator.skipOnEmptyLog && isEmptyLog(args);
  const contextParts = buildContextParts(context, methodConfig, config, method);

  const preSeparator = shouldSkipSeparator
    ? null
    : formatSeparator(separator.preLog, separatorColor);
  const postSeparator = shouldSkipSeparator
    ? null
    : formatSeparator(separator.postLog, separatorColor);

  // Print pre-log separator
  if (preSeparator) {
    deps.originalConsole.log(preSeparator);
  }

  // Combine context info with actual log content
  if (contextParts.length > 0 && args.length > 0) {
    const contextString = contextParts.join(' ');
    deps.originalMethod(...buildMainMessageArgs(contextString, args));
  } else if (contextParts.length > 0) {
    // Only context, no content
    deps.originalMethod(contextParts.join(' '));
  } else if (args.length > 0) {
    // Only content, no context
    deps.originalMethod(...args);
  }

  // Print post-log separator
  if (postSeparator) {
    deps.originalConsole.log(postSeparator);
  }

  // Add spacing if enabled
  if (methodConfig.addNewLine) {
    deps.originalConsole.log('');
  }
}
