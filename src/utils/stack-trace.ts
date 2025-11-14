import { LogContext } from '../types';
import { STACK_TRACE_PATTERNS } from '../constants/regex-patterns';
import { MIN_STACK_SEARCH_DEPTH, STACK_SKIP_LINES } from '../constants/stack-trace';
import { isInternalFile } from './internal-files';
import { extractFileName } from './file-name';
import { extractFunctionName } from './function-name';

interface StackTraceConfig {
  captureStack?: boolean;
  maxStackDepth?: number;
  debug?: boolean;
}

interface ConsoleLike {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * Parses the current stack trace to extract context information
 * @param config Configuration object with captureStack, maxStackDepth, and debug flags
 * @param originalConsole Console-like object for debug logging (only needs log and error methods)
 * @returns LogContext with fileName, functionName, lineNumber, and columnNumber
 */
export function parseStackTrace(
  config: StackTraceConfig,
  originalConsole: ConsoleLike
): LogContext {
  if (!config.captureStack) {
    return {};
  }

  try {
    const stack = new Error().stack;
    if (!stack) {
      if (config.debug) {
        originalConsole.log('[Loggatron Debug] No stack trace available');
      }
      return {};
    }

    const stackLines = stack.split('\n');

    if (config.debug) {
      originalConsole.log('[Loggatron Debug] Full stack trace:');
      stackLines.forEach((line, idx) => {
        originalConsole.log(`  [${idx}] ${line}`);
      });
    }

    const skipLines = STACK_SKIP_LINES;
    const maxDepth = config.maxStackDepth || 3;
    // When all initial frames are internal (e.g., React error boundaries),
    // we need to search deeper. Use a larger search window but still respect maxDepth preference.
    const searchDepth = Math.max(maxDepth * 2, MIN_STACK_SEARCH_DEPTH);
    const relevantLines = stackLines.slice(skipLines, skipLines + searchDepth);

    if (config.debug) {
      originalConsole.log(
        `[Loggatron Debug] Skipping first ${skipLines} lines, examining next ${searchDepth} lines:`
      );
      relevantLines.forEach((line, idx) => {
        originalConsole.log(`  [${skipLines + idx}] ${line}`);
      });
    }

    for (let i = 0; i < relevantLines.length; i++) {
      const line = relevantLines[i];

      if (config.debug) {
        originalConsole.log(`[Loggatron Debug] Examining line ${skipLines + i}: "${line}"`);
      }

      // Try to match different stack trace formats
      const atSymbolMatch = line.match(STACK_TRACE_PATTERNS.atSymbol);
      const withParenthesesMatch = line.match(STACK_TRACE_PATTERNS.withParentheses);
      const simpleMatch = line.match(STACK_TRACE_PATTERNS.simple);

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
        if (config.debug) {
          originalConsole.log(`[Loggatron Debug] No match found for line: "${line}"`);
        }
        continue;
      }

      if (config.debug) {
        originalConsole.log(`[Loggatron Debug] Match found:`);
        originalConsole.log(`  - name: "${name}"`);
        originalConsole.log(`  - filePath: "${filePath}"`);
        originalConsole.log(`  - lineNumber: ${lineNumber}`);
        originalConsole.log(`  - columnNumber: ${columnNumber}`);
      }

      // Skip internal files and node_modules
      if (isInternalFile(filePath, name)) {
        if (config.debug) {
          originalConsole.log(`[Loggatron Debug] Skipping internal file: "${filePath}"`);
        }
        continue;
      }

      const fileName = extractFileName(filePath, config.debug, originalConsole);
      const functionName = extractFunctionName(name, filePath, config.debug, originalConsole);

      if (config.debug) {
        originalConsole.log(`[Loggatron Debug] Extracted context:`);
        originalConsole.log(`  - fileName: "${fileName}"`);
        originalConsole.log(`  - functionName: "${functionName}"`);
        originalConsole.log(`  - lineNumber: ${lineNumber}`);
        originalConsole.log(`  - columnNumber: ${columnNumber}`);
      }

      return {
        fileName,
        functionName: functionName,
        lineNumber,
        columnNumber,
      };
    }

    if (config.debug) {
      originalConsole.log('[Loggatron Debug] No valid context found in stack trace');
    }
  } catch (e) {
    if (config.debug) {
      originalConsole.error('[Loggatron Debug] Error capturing context:', e);
    }
    // Silent fail if stack capture fails
  }

  return {};
}
