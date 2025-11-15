import { LoggatronConfig } from '../types';
import { DEFAULT_CONFIG } from '../constants';

/**
 * Merges user configuration with default configuration
 * @param config User-provided configuration
 * @returns Merged configuration (without overrides)
 */
export function mergeConfig(
  config: LoggatronConfig
): Partial<Required<Omit<LoggatronConfig, 'overrides'>>> {
  return {
    ...config,
    separator: {
      ...DEFAULT_CONFIG.separator,
      ...config.separator,
    },
    colors: { ...DEFAULT_CONFIG.colors, ...config.colors },
    emojis: { ...DEFAULT_CONFIG.emojis, ...config.emojis },
  };
}
