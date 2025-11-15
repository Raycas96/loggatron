/**
 * Checks if a file path or function name belongs to internal/loggatron code
 * @param filePath The file path to check
 * @param name The function/name to check
 * @returns true if the file should be skipped (internal), false otherwise
 */
export function isInternalFile(filePath: string, name: string): boolean {
  const filePathLower = filePath.toLowerCase();
  const nameLower = name.toLowerCase();

  return (
    filePathLower.includes('node_modules') ||
    filePathLower.includes('loggatron/dist') ||
    filePathLower.includes('loggatron/src') ||
    filePathLower.endsWith('logger.ts') ||
    ((filePathLower.endsWith('index.ts') || filePathLower.endsWith('index.js')) &&
      (filePathLower.includes('loggatron/dist') || filePathLower.includes('loggatron/src'))) ||
    nameLower.includes('loggatron')
  );
}
