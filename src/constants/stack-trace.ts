/**
 * Constants for stack trace processing
 */

/**
 * Minimum number of stack frames to search when looking for user code
 * Used when initial frames are all internal (e.g., React error boundaries)
 */
export const MIN_STACK_SEARCH_DEPTH = 10;

/**
 * Number of initial stack lines to skip
 * Skips: Error, captureContext, log, console.<computed>
 */
export const STACK_SKIP_LINES = 4;
