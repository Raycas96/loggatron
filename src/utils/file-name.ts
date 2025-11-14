/**
 * Extracts just the filename from a full file path
 * Removes query strings, hashes, and directory paths
 * @param filePath The full file path
 * @param debug Whether to output debug logs
 * @param originalConsole The original console object for debug logging
 * @returns The extracted filename
 */
export function extractFileName(
  filePath: string,
  debug = false,
  originalConsole?: typeof console
): string {
  if (debug && originalConsole) {
    originalConsole.log(`[Loggatron Debug] extractFileName input: "${filePath}"`);
  }

  // Remove query strings and hashes
  const cleanPath = filePath.split('?')[0].split('#')[0];

  // Extract just the filename
  const parts = cleanPath.split(/[/\\]/);
  const fileName = parts[parts.length - 1] || cleanPath;

  if (debug && originalConsole) {
    originalConsole.log(`[Loggatron Debug] extractFileName output: "${fileName}"`);
  }

  return fileName;
}
