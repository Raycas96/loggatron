import { extractFileName } from './file-name';

/**
 * Extracts a meaningful function/component name from a function name and file path
 * @param functionName The function name from the stack trace
 * @param filePath The file path from the stack trace
 * @param debug Whether to output debug logs
 * @param originalConsole The original console object for debug logging
 * @returns A meaningful function/component name
 */
export function extractFunctionName(
  functionName: string,
  filePath: string,
  debug = false,
  originalConsole?: typeof console
): string {
  if (debug && originalConsole) {
    originalConsole.log(
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
      const result = cleanedFunctionName.includes('/')
        ? cleanedFunctionName.split('/').at(-1) || ''
        : cleanedFunctionName;

      if (debug && originalConsole) {
        originalConsole.log(`[Loggatron Debug] extractFunctionName (URL) output: "${result}"`);
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
    if (debug && originalConsole) {
      originalConsole.log(
        `[Loggatron Debug] extractFunctionName (meaningful) output: "${functionName}"`
      );
    }
    return functionName;
  }

  // Otherwise try to extract from file path
  const fileName = extractFileName(filePath, debug, originalConsole);
  const nameWithoutExt = fileName.split('.')[0];

  // Capitalize first letter if it's lowercase (common component pattern)
  let result = 'Unknown';
  if (nameWithoutExt && nameWithoutExt.length > 0) {
    result = nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1);
  }

  if (debug && originalConsole) {
    originalConsole.log(`[Loggatron Debug] extractFunctionName (from file) output: "${result}"`);
  }

  return result;
}
