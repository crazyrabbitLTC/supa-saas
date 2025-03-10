/**
 * @file API Test Setup
 * @version 0.1.0
 * 
 * Setup file for API tests
 */

// Increase timeout for all tests
jest.setTimeout(30000);

// Suppress console output during tests
beforeAll(() => {
  // Store original console methods
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  };

  // Mock console methods to suppress output during tests
  if (process.env.NODE_ENV !== 'test-debug') {
    global.console.log = jest.fn();
    global.console.error = jest.fn();
    global.console.warn = jest.fn();
    global.console.info = jest.fn();
  }

  // Add to global for use in tests that need to see console output
  (global as any).originalConsole = originalConsole;
});

// Restore console after all tests
afterAll(() => {
  // Restore original console methods
  if ((global as any).originalConsole) {
    global.console.log = (global as any).originalConsole.log;
    global.console.error = (global as any).originalConsole.error;
    global.console.warn = (global as any).originalConsole.warn;
    global.console.info = (global as any).originalConsole.info;
  }
});

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
}); 