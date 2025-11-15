/**
 * Regular expression patterns for parsing stack traces
 */
export const STACK_TRACE_PATTERNS = {
  /**
   * Matches browser/Node.js format: at functionName (file:///path/to/file.js:line:column)
   * Example: "at MyFunction (file:///path/to/file.js:42:15)"
   */
  withParentheses: /at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/,

  /**
   * Matches format: at file:line:column (no function name, no parentheses)
   * Example: "at file:///path/to/file.js:42:15"
   */
  simple: /at\s+(.+?):(\d+):(\d+)(?:\s.*)?$/,

  /**
   * Matches browser format: functionName @ file:line (without "at")
   * Example: "MyFunction @ file:///path/to/file.js:42:15"
   */
  atSymbol: /^(.+?)\s+@\s+(.+?):(\d+)(?::(\d+))?$/,
} as const;
