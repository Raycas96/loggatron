export type LogMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

export interface MethodOverrideConfig {
  separator?: {
    preLog?: string;
    postLog?: string;
  };
  showFileName?: boolean;
  showComponentName?: boolean;
  color?: string;
  emoji?: string;
}

export interface LoggatronConfig {
  enabled?: boolean;
  // Global defaults
  separator?: {
    preLog?: string;
    postLog?: string;
  };
  showFileName?: boolean;
  showComponentName?: boolean;
  colors?: {
    log?: string;
    info?: string;
    warn?: string;
    error?: string;
    debug?: string;
  };
  emojis?: {
    log?: string;
    info?: string;
    warn?: string;
    error?: string;
    debug?: string;
  };
  methods?: LogMethod[];
  captureStack?: boolean;
  maxStackDepth?: number;
  // Method-specific overrides
  overrides?: {
    log?: MethodOverrideConfig;
    info?: MethodOverrideConfig;
    warn?: MethodOverrideConfig;
    error?: MethodOverrideConfig;
    debug?: MethodOverrideConfig;
  };
}
