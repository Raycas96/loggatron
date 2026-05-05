/**
 * Returns true if the given file path / function name belongs to Loggatron's
 * own runtime code. Such frames must always be skipped when picking the
 * attributed call site for a log.
 */
export function isLoggatronInternal(filePath: string, name: string): boolean {
  const filePathLower = filePath.toLowerCase();
  const nameLower = name.toLowerCase();

  return (
    filePathLower.includes('loggatron/dist') ||
    filePathLower.includes('loggatron/src') ||
    filePathLower.endsWith('logger.ts') ||
    filePathLower.endsWith('loggatron.ts') ||
    filePathLower.endsWith('runtime.ts') ||
    ((filePathLower.endsWith('index.ts') || filePathLower.endsWith('index.js')) &&
      (filePathLower.includes('loggatron/dist') || filePathLower.includes('loggatron/src'))) ||
    nameLower.includes('loggatron')
  );
}

/**
 * Returns true if the file path lives inside `node_modules`. Such frames are
 * preferred to be skipped (so we attribute logs to *your* code, not the
 * library that called `console.log` for you), but they remain a usable
 * fallback when no application frame is present in the stack.
 */
export function isNodeModules(filePath: string): boolean {
  return filePath.toLowerCase().includes('node_modules');
}
