import { LoggatronConfig } from '../types';
import { COLORS } from './colors';

export const DEFAULT_CONFIG: Required<Omit<LoggatronConfig, 'overrides'>> & {
  overrides?: LoggatronConfig['overrides'];
} = {
  enabled: true,
  separator: {
    preLog: '--------------------------------',
    postLog: '--------------------------------',
    color: COLORS.BrightWhite,
    skipOnEmptyLog: true,
  },
  addNewLine: false,
  showFileName: true,
  showFunctionName: true,
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
  debug: false,
  overrides: undefined,
};

export const RESET_COLOR = '\x1b[0m';
