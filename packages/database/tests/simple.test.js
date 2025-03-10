/**
 * Simple Tests
 * 
 * These tests are written in JavaScript to avoid TypeScript compilation issues.
 */

describe('Simple Tests', () => {
  test('should pass a simple test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle async operations', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });

  test('should handle arrays', () => {
    const array = [1, 2, 3];
    expect(array).toHaveLength(3);
    expect(array).toContain(2);
  });

  test('should handle objects', () => {
    const obj = { name: 'Test', value: 123 };
    expect(obj).toHaveProperty('name');
    expect(obj.name).toBe('Test');
    expect(obj.value).toBe(123);
  });
}); 