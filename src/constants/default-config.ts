import { LoggatronConfig } from '../types';
import { COLORS } from './colors';

export const DEFAULT_CONFIG: Required<Omit<LoggatronConfig, 'overrides'>> & {
  overrides?: LoggatronConfig['overrides'];
} = {
  enabled: true,
  separator: {
    preLog: '===========================',
    postLog: '===========================',
  },
  showFileName: true,
  showComponentName: true,
  colors: {
    log: COLORS.Cyan, // Cyan
    info: COLORS.Green, // Green
    warn: COLORS.Yellow, // Yellow
    error: COLORS.Red, // Red
    debug: COLORS.Magenta, // Magenta
  },
  emojis: {
    log: '📝',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    debug: '🐛',
  },
  methods: ['log', 'info', 'warn', 'error', 'debug'],
  captureStack: true,
  maxStackDepth: 3,
  overrides: undefined,
};

export const RESET_COLOR = '\x1b[0m';
