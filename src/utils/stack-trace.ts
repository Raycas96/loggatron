import { parse, type StackFrame } from 'stacktrace-parser';
import { LogContext } from '../types';
import { isLoggatronInternal, isNodeModules } from './internal-files';
import { ConsoleLike } from '../types/ConsoleLike';

interface StackTraceConfig {
  captureStack?: boolean;
  maxStackDepth?: number;
  debug?: boolean;
}

const DEFAULT_MAX_DEPTH = 3;
const MIN_SEARCH_DEPTH = 10;

/**
 * Parses the current stack trace to extract context information.
 *
 * Strategy:
 *   1. Skip Loggatron's own frames (always — they are noise).
 *   2. Prefer the first application frame (anything outside `node_modules`).
 *   3. Fall back to the first `node_modules` frame if no app frame exists.
 *      This way logs originating fully inside a library still get attribution.
 *   4. Otherwise return an empty context.
 *
 * @param config Configuration object with captureStack, maxStackDepth, and debug flags
 * @param originalConsole Console-like object for debug logging
 */
export function parseStackTrace(
  config: StackTraceConfig,
  originalConsole: ConsoleLike
): LogContext {
  if (!config.captureStack) {
    return {};
  }

  const stack = new Error().stack;
  if (!stack) {
    if (config.debug) {
      originalConsole.log('[Loggatron Debug] No stack trace available');
    }
    return {};
  }

  let frames: StackFrame[];
  try {
    frames = parse(stack);
  } catch (e) {
    if (config.debug) {
      originalConsole.error('[Loggatron Debug] Error parsing stack trace:', e);
    }
    return {};
  }

  if (config.debug) {
    originalConsole.log('[Loggatron Debug] Parsed frames:');
    frames.forEach((f, idx) => {
      originalConsole.log(
        `  [${idx}] ${f.methodName} @ ${f.file ?? '<no file>'}:${f.lineNumber ?? 0}:${f.column ?? 0}`
      );
    });
  }

  const maxDepth = config.maxStackDepth || DEFAULT_MAX_DEPTH;
  const searchDepth = Math.max(maxDepth * 2, MIN_SEARCH_DEPTH);
  const searchWindow = frames.slice(0, searchDepth);

  let nodeModulesFallback: StackFrame | null = null;

  for (const frame of searchWindow) {
    const filePath = frame.file ?? '';
    const methodName = frame.methodName ?? '';

    if (!filePath) {
      continue;
    }

    if (isLoggatronInternal(filePath, methodName)) {
      if (config.debug) {
        originalConsole.log(`[Loggatron Debug] Skipping Loggatron internal frame: "${filePath}"`);
      }
      continue;
    }

    if (isNodeModules(filePath)) {
      if (!nodeModulesFallback) {
        nodeModulesFallback = frame;
        if (config.debug) {
          originalConsole.log(
            `[Loggatron Debug] Remembering node_modules frame as fallback: "${filePath}"`
          );
        }
      }
      continue;
    }

    return frameToContext(frame);
  }

  if (nodeModulesFallback) {
    if (config.debug) {
      originalConsole.log('[Loggatron Debug] No app frame found, using node_modules fallback');
    }
    return frameToContext(nodeModulesFallback);
  }

  if (config.debug) {
    originalConsole.log('[Loggatron Debug] No valid context found in stack trace');
  }
  return {};
}

function frameToContext(frame: StackFrame): LogContext {
  const filePath = frame.file ?? '';
  return {
    fileName: extractBasename(filePath),
    functionName: normalizeFunctionName(frame.methodName ?? '', filePath),
    lineNumber: frame.lineNumber ?? 0,
    columnNumber: frame.column ?? 0,
  };
}

function extractBasename(filePath: string): string {
  const cleanPath = filePath.split('?')[0].split('#')[0];
  const parts = cleanPath.split(/[/\\]/);
  return parts[parts.length - 1] || cleanPath;
}

function normalizeFunctionName(rawName: string, filePath: string): string {
  // stacktrace-parser uses "<unknown>" for anonymous frames
  const looksMeaningful =
    rawName &&
    rawName !== '<unknown>' &&
    rawName !== 'anonymous' &&
    /[a-zA-Z]/.test(rawName) &&
    !rawName.startsWith('Object.') &&
    !rawName.includes('.');

  if (looksMeaningful) {
    return rawName;
  }

  // Fallback: derive a component-like name from the file basename
  const base = extractBasename(filePath).split('.')[0];
  if (!base) {
    return 'Unknown';
  }
  return base.charAt(0).toUpperCase() + base.slice(1);
}
