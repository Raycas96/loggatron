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
  const { separator, showFileName, showFunctionName } = methodConfig;
  const separatorColor = separator.color || '';
  const color = config.colors[method];
  const emoji = config.emojis[method];
  const reset = RESET_COLOR;
  const isEmptyLog =
    args.length === 0 ||
    (args.length === 1 && typeof args[0] === 'string' && args[0].trim() === '');

  const shouldSkipSeparator = separator.skipOnEmptyLog && isEmptyLog;

  // Build pre-log separator
  const preLogParts: string[] = [];
  if (separator.preLog && !shouldSkipSeparator) {
    preLogParts.push(`${separatorColor}${separator.preLog}${reset}`);
  }

  // Build context info
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

  // Build post-log separator
  const postLogParts: string[] = [];
  if (separator.postLog && !shouldSkipSeparator) {
    postLogParts.push(`${separatorColor}${separator.postLog}${reset}`);
  }

  // Print pre-log separator
  if (preLogParts.length > 0) {
    deps.originalConsole.log(preLogParts.join(' '));
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
        deps.originalMethod(`${firstLineWithContext}\n${restOfLines}`, ...args.slice(1));
      } else {
        // Single-line string: prepend context normally
        deps.originalMethod(`${contextString} ${firstArg}`, ...args.slice(1));
      }
    } else if (firstArg instanceof Error) {
      // If first arg is an Error, prepend context to the error message
      const errorWithContext = new Error(`${contextString} ${firstArg.message}`);
      Object.assign(errorWithContext, firstArg, {
        message: `${contextString} ${firstArg.message}`,
        stack: firstArg.stack,
        name: firstArg.name,
      });
      deps.originalMethod(errorWithContext, ...args.slice(1));
    } else {
      // For other types, combine as separate arguments
      deps.originalMethod(contextString, ...args);
    }
  } else if (contextParts.length > 0) {
    // Only context, no content
    deps.originalMethod(contextParts.join(' '));
  } else if (args.length > 0) {
    // Only content, no context
    deps.originalMethod(...args);
  }

  // Print post-log separator
  if (postLogParts.length > 0) {
    deps.originalConsole.log(postLogParts.join(' '));
  }

  // Add spacing if enabled
  if (methodConfig.addNewLine) {
    deps.originalConsole.log('');
  }
}
