import { describe, it, expect, beforeEach, afterEach, vi, MockInstance } from 'vitest';
import { init, configure, destroy, getInstance } from './index';
import { Loggatron } from './logger';

describe('Loggatron API', () => {
  let consoleLogSpy: MockInstance;
  let consoleInfoSpy: MockInstance;
  let consoleErrorSpy: MockInstance;
  let consoleWarnSpy: MockInstance;
  let consoleDebugSpy: MockInstance;

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up after each test
    destroy();
    consoleLogSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  describe('init', () => {
    it('should initialize Loggatron with default config', () => {
      const logger = init();
      expect(logger).toBeInstanceOf(Loggatron);
      expect(getInstance()).toBeInstanceOf(Loggatron);
    });

    it('should initialize Loggatron with custom config', () => {
      const logger = init({
        separator: {
          preLog: 'CUSTOM',
        },
      });
      expect(logger).toBeInstanceOf(Loggatron);
    });

    it('should configure existing instance if already initialized', () => {
      init();
      const firstInstance = getInstance();

      init({
        separator: {
          preLog: 'UPDATED',
        },
      });
      const secondInstance = getInstance();

      // Should be the same instance
      expect(firstInstance).toBe(secondInstance);
    });

    it('should intercept console methods after init', () => {
      init();
      console.log('test');

      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls;
      expect(calls.length).toBeGreaterThan(1);
    });
  });

  describe('configure', () => {
    it('should configure existing instance', () => {
      init();
      configure({
        enabled: false,
      });

      consoleLogSpy.mockClear();
      console.log('test');
      // Should not be intercepted if disabled
      expect(consoleLogSpy).toHaveBeenCalledWith('test');
    });

    it('should initialize if no instance exists', () => {
      expect(getInstance()).toBeNull();

      configure({
        separator: {
          preLog: 'AUTO_INIT',
        },
      });

      expect(getInstance()).toBeInstanceOf(Loggatron);
    });

    it('should merge override configurations', () => {
      init();
      configure({
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
      expect(consoleInfoSpy).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should destroy instance and restore console', () => {
      init();
      expect(getInstance()).not.toBeNull();

      destroy();
      expect(getInstance()).toBeNull();

      // Console should be restored
      consoleLogSpy.mockClear();
      console.log('test');
      expect(consoleLogSpy).toHaveBeenCalledWith('test');
    });

    it('should not throw if no instance exists', () => {
      expect(() => destroy()).not.toThrow();
    });

    it('should allow re-initialization after destroy', () => {
      init();
      destroy();

      const logger = init();
      expect(logger).toBeInstanceOf(Loggatron);
      expect(getInstance()).toBeInstanceOf(Loggatron);
    });
  });

  describe('getInstance', () => {
    it('should return null if not initialized', () => {
      expect(getInstance()).toBeNull();
    });

    it('should return instance after init', () => {
      init();
      const instance = getInstance();
      expect(instance).toBeInstanceOf(Loggatron);
    });

    it('should return null after destroy', () => {
      init();
      destroy();
      expect(getInstance()).toBeNull();
    });

    it('should return same instance on multiple calls', () => {
      init();
      const instance1 = getInstance();
      const instance2 = getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Loggatron class export', () => {
    it('should export Loggatron class', () => {
      expect(Loggatron).toBeDefined();
      expect(typeof Loggatron).toBe('function');
    });

    it('should allow creating custom instances', () => {
      const customLogger = new Loggatron({
        enabled: false,
      });

      expect(customLogger).toBeInstanceOf(Loggatron);
      customLogger.init();
      customLogger.destroy();
    });

    it('should not interfere with singleton instance', () => {
      const singleton = init();
      const custom = new Loggatron();

      expect(getInstance()).toBe(singleton);
      expect(custom).not.toBe(singleton);
    });
  });

  describe('integration scenarios', () => {
    it('should handle init -> configure -> destroy flow', () => {
      init();
      configure({ enabled: true });
      console.log('test1');

      configure({ enabled: false });
      consoleLogSpy.mockClear();
      console.log('test2');
      expect(consoleLogSpy).toHaveBeenCalledWith('test2');

      destroy();
      expect(getInstance()).toBeNull();
    });

    it('should handle multiple configure calls', () => {
      init();
      configure({ separator: { preLog: 'FIRST' } });
      configure({ separator: { postLog: 'SECOND' } });

      console.log('test');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should work with method-specific overrides through configure', () => {
      init();
      configure({
        overrides: {
          error: {
            separator: {
              preLog: 'ERROR_START',
              postLog: 'ERROR_END',
            },
          },
        },
      });

      console.error('error message');

      // Separators are logged via console.log, so check consoleLogSpy
      const logCalls = consoleLogSpy.mock.calls;
      const callStrings = logCalls.map((call: unknown[]) => String(call[0])).join(' ');
      expect(callStrings).toContain('ERROR_START');
    });
  });

  describe('type exports', () => {
    it('should have proper type exports', () => {
      // This is a compile-time test, but we can verify the structure
      const config = {
        enabled: true,
        separator: {
          preLog: 'test',
        },
      };

      init(config);
      expect(getInstance()).toBeDefined();
    });
  });
});
