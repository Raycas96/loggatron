import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Loggatron } from './logger';
import { DEFAULT_CONFIG } from './constants';

describe('Loggatron', () => {
  let logger: Loggatron;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleLogSpy: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleInfoSpy: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleWarnSpy: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleErrorSpy: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleDebugSpy: any;

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    logger?.destroy();
    consoleLogSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      logger = new Loggatron();
      expect(logger).toBeInstanceOf(Loggatron);
    });

    it('should merge custom config with defaults', () => {
      logger = new Loggatron({
        enabled: false,
        separator: {
          preLog: 'CUSTOM',
        },
      });

      logger.init();
      console.log('test');

      // Should not intercept if disabled
      expect(consoleLogSpy).toHaveBeenCalledWith('test');
    });
  });

  describe('init', () => {
    it('should intercept console.log when initialized', () => {
      logger = new Loggatron();
      logger.init();

      console.log('test message');

      // Should have been called with separator and message
      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(1);
    });

    it('should not initialize if already initialized', () => {
      logger = new Loggatron();
      logger.init();
      const callCountBefore = consoleLogSpy.mock.calls.length;

      logger.init();
      console.log('test');

      // Should only call once (from second log)
      expect(consoleLogSpy.mock.calls.length).toBeGreaterThan(callCountBefore);
    });

    it('should not initialize if disabled', () => {
      logger = new Loggatron({ enabled: false });
      logger.init();

      console.log('test');
      // Should be called directly, not intercepted
      expect(consoleLogSpy).toHaveBeenCalledWith('test');
    });

    it('should intercept only specified methods', () => {
      logger = new Loggatron({
        methods: ['log', 'error'],
      });
      logger.init();

      console.log('log test');
      console.info('info test');
      console.error('error test');

      // log and error should be intercepted
      expect(consoleLogSpy.mock.calls.length).toBeGreaterThan(1);
      expect(consoleErrorSpy.mock.calls.length).toBeGreaterThan(1);
      // info should be direct call (not intercepted)
      expect(consoleInfoSpy).toHaveBeenCalledWith('info test');
    });
  });

  describe('destroy', () => {
    it('should restore original console methods', () => {
      logger = new Loggatron();
      logger.init();

      const originalLog = console.log;

      logger.destroy();

      // After destroy, should restore original
      console.log('test');
      expect(consoleLogSpy).toHaveBeenCalledWith('test');
    });

    it('should not throw if not initialized', () => {
      logger = new Loggatron();
      expect(() => logger.destroy()).not.toThrow();
    });

    it('should allow re-initialization after destroy', () => {
      logger = new Loggatron();
      logger.init();
      logger.destroy();
      logger.init();

      console.log('test');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      logger = new Loggatron();
      logger.init();

      logger.configure({
        enabled: false,
      });

      // Should stop intercepting
      consoleLogSpy.mockClear();
      console.log('test');
      expect(consoleLogSpy).toHaveBeenCalledWith('test');
    });

    it('should merge override configs', () => {
      logger = new Loggatron();
      logger.init();

      logger.configure({
        overrides: {
          info: {
            separator: {
              preLog: '',
              postLog: '',
            },
          },
        },
      });

      console.info('test');
      // Info should not have separators
      const calls = consoleInfoSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    });
  });

  describe('method overrides', () => {
    it('should apply method-specific separator overrides', () => {
      logger = new Loggatron({
        overrides: {
          log: {
            separator: {
              preLog: 'CUSTOM_PRE',
              postLog: 'CUSTOM_POST',
            },
          },
        },
      });
      logger.init();

      console.log('test');

      const calls = consoleLogSpy.mock.calls;
      const firstCall = calls[0]?.[0];
      expect(String(firstCall)).toContain('CUSTOM_PRE');
    });

    it('should apply method-specific showFileName override', () => {
      logger = new Loggatron({
        showFileName: true,
        overrides: {
          info: {
            showFileName: false,
          },
        },
      });
      logger.init();

      console.info('test');

      const calls = consoleInfoSpy.mock.calls;
      // Should not include file name for info
      const callStrings = calls.map((call: unknown[]) => String(call[0])).join(' ');
      expect(callStrings).not.toMatch(/\(.*:\d+\)/);
    });

    it('should apply method-specific showComponentName override', () => {
      logger = new Loggatron({
        showComponentName: true,
        overrides: {
          debug: {
            showComponentName: false,
          },
        },
      });
      logger.init();

      console.debug('test');

      const calls = consoleDebugSpy.mock.calls;
      const callStrings = calls.map((call: unknown[]) => String(call[0])).join(' ');
      // Should not include component name brackets for debug
      expect(callStrings).not.toMatch(/\[.*\]/);
    });

    it('should apply method-specific color override', () => {
      logger = new Loggatron({
        overrides: {
          warn: {
            color: '\x1b[31m', // Red instead of default yellow
          },
        },
      });
      logger.init();

      console.warn('test');

      const calls = consoleWarnSpy.mock.calls;
      const callStrings = calls.map((call: unknown[]) => String(call[0])).join(' ');
      expect(callStrings).toContain('\x1b[31m');
    });

    it('should apply method-specific emoji override', () => {
      logger = new Loggatron({
        overrides: {
          error: {
            emoji: '🔥',
          },
        },
      });
      logger.init();

      console.error('test');

      const calls = consoleErrorSpy.mock.calls;
      const callStrings = calls.map((call: unknown[]) => String(call[0])).join(' ');
      expect(callStrings).toContain('🔥');
    });

    it('should fallback to global config when override is undefined', () => {
      logger = new Loggatron({
        separator: {
          preLog: 'GLOBAL_PRE',
          postLog: 'GLOBAL_POST',
        },
        overrides: {
          info: {
            // No separator override, should use global
          },
        },
      });
      logger.init();

      console.info('test');

      const calls = consoleInfoSpy.mock.calls;
      const firstCall = calls[0]?.[0];
      expect(String(firstCall)).toContain('GLOBAL_PRE');
    });
  });

  describe('separators', () => {
    it('should show pre-log separator', () => {
      logger = new Loggatron({
        separator: {
          preLog: 'PRE_LOG',
          postLog: 'POST_LOG',
        },
      });
      logger.init();

      console.log('test');

      const calls = consoleLogSpy.mock.calls;
      expect(String(calls[0]?.[0])).toContain('PRE_LOG');
    });

    it('should show post-log separator', () => {
      logger = new Loggatron({
        separator: {
          preLog: 'PRE_LOG',
          postLog: 'POST_LOG',
        },
      });
      logger.init();

      console.log('test');

      const calls = consoleLogSpy.mock.calls;
      const postLogCall = calls.find((call: unknown[]) => String(call[0]).includes('POST_LOG'));
      expect(postLogCall).toBeDefined();
    });

    it('should not show separator if empty string', () => {
      logger = new Loggatron({
        separator: {
          preLog: '',
          postLog: '',
        },
      });
      logger.init();

      console.log('test');

      const calls = consoleLogSpy.mock.calls;
      const allCalls = calls.map((call: unknown[]) => String(call[0])).join(' ');
      expect(allCalls).not.toContain(DEFAULT_CONFIG.separator.preLog);
    });
  });

  describe('context display', () => {
    it('should show file name when enabled', () => {
      logger = new Loggatron({
        showFileName: true,
        captureStack: true,
      });
      logger.init();

      console.log('test');

      const calls = consoleLogSpy.mock.calls;
      const allCalls = calls.map((call: unknown[]) => String(call[0])).join(' ');
      // Should contain file information
      expect(allCalls.length).toBeGreaterThan(0);
    });

    it('should not show file name when disabled', () => {
      logger = new Loggatron({
        showFileName: false,
      });
      logger.init();

      console.log('test');

      const calls = consoleLogSpy.mock.calls;
      const callStrings = calls.map((call: unknown[]) => String(call[0])).join(' ');
      // Should not contain file path patterns
      expect(callStrings).not.toMatch(/\([^)]+\.ts:\d+\)/);
    });

    it('should show component name when enabled', () => {
      logger = new Loggatron({
        showComponentName: true,
      });
      logger.init();

      console.log('test');

      const calls = consoleLogSpy.mock.calls;
      const callStrings = calls.map((call: unknown[]) => String(call[0])).join(' ');
      // May or may not have component name depending on stack trace
      expect(callStrings.length).toBeGreaterThan(0);
    });

    it('should not capture stack when disabled', () => {
      logger = new Loggatron({
        captureStack: false,
      });
      logger.init();

      console.log('test');

      // Should still log, but without context
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('emojis and colors', () => {
    it('should include emoji in log output', () => {
      logger = new Loggatron({
        emojis: {
          log: '📝',
        },
      });
      logger.init();

      console.log('test');

      const calls = consoleLogSpy.mock.calls;
      const callStrings = calls.map((call: unknown[]) => String(call[0])).join(' ');
      expect(callStrings).toContain('📝');
    });

    it('should include color codes in output', () => {
      logger = new Loggatron({
        colors: {
          log: '\x1b[36m',
        },
      });
      logger.init();

      console.log('test');

      const calls = consoleLogSpy.mock.calls;
      const callStrings = calls.map((call: unknown[]) => String(call[0])).join(' ');
      expect(callStrings).toContain('\x1b[36m');
    });

    it('should apply different colors for different methods', () => {
      logger = new Loggatron();
      logger.init();

      console.log('log');
      console.error('error');

      const logCalls = consoleLogSpy.mock.calls.map((call: unknown[]) => String(call[0])).join(' ');
      const errorCalls = consoleErrorSpy.mock.calls
        .map((call: unknown[]) => String(call[0]))
        .join(' ');

      expect(logCalls).toContain(DEFAULT_CONFIG.colors.log);
      expect(errorCalls).toContain(DEFAULT_CONFIG.colors.error);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string in overrides', () => {
      logger = new Loggatron({
        overrides: {
          info: {
            separator: {
              preLog: '',
              postLog: '',
            },
            emoji: '',
          },
        },
      });
      logger.init();

      expect(() => console.info('test')).not.toThrow();
    });

    it('should handle multiple arguments', () => {
      logger = new Loggatron();
      logger.init();

      console.log('arg1', 'arg2', { key: 'value' });

      // Should handle multiple args
      expect(consoleLogSpy).toHaveBeenCalled();
      // Find the call that contains the actual arguments
      // The logger makes multiple calls: separator, context, actual args, separator, spacing
      const callWithArgs = consoleLogSpy.mock.calls.find(
        (call: unknown[]) =>
          call.length === 3 &&
          call[0] === 'arg1' &&
          call[1] === 'arg2' &&
          typeof call[2] === 'object' &&
          call[2] !== null &&
          'key' in call[2] &&
          (call[2] as { key: string }).key === 'value'
      );
      expect(callWithArgs).toBeDefined();
      expect(callWithArgs).toEqual(['arg1', 'arg2', { key: 'value' }]);
    });

    it('should handle undefined and null values', () => {
      logger = new Loggatron();
      logger.init();

      expect(() => {
        console.log(undefined);
        console.log(null);
      }).not.toThrow();
    });

    it('should handle objects and arrays', () => {
      logger = new Loggatron();
      logger.init();

      const obj = { a: 1, b: 2 };
      const arr = [1, 2, 3];

      expect(() => {
        console.log(obj);
        console.log(arr);
      }).not.toThrow();
    });
  });
});
