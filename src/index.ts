import { Loggatron } from './logger';
import type { LoggatronConfig, LogContext } from './types';

// Singleton instance
let instance: Loggatron | null = null;

/**
 * Initialize Loggatron with optional configuration
 * Call this once in your main application file
 */
export function init(config?: LoggatronConfig): Loggatron {
  if (instance) {
    instance.configure(config || {});
  } else {
    instance = new Loggatron(config);
    instance.init();
  }
  return instance;
}

/**
 * Update configuration of existing Loggatron instance
 */
export function configure(config: LoggatronConfig): void {
  if (!instance) {
    init(config);
  } else {
    instance.configure(config);
  }
}

/**
 * Destroy Loggatron and restore original console methods
 */
export function destroy(): void {
  if (instance) {
    instance.destroy();
    instance = null;
  }
}

/**
 * Get the current Loggatron instance
 */
export function getInstance(): Loggatron | null {
  return instance;
}

// Export class for advanced usage
export { Loggatron };

// Export types
export type { LoggatronConfig, LogContext };
