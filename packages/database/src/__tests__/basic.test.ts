/**
 * @file Basic Tests
 * @version 0.1.0
 * 
 * Basic tests to verify Vitest is working.
 */

import { describe, it, expect } from 'vitest';

describe('Basic Tests', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });

  it('should handle arrays', () => {
    const array = [1, 2, 3];
    expect(array).toHaveLength(3);
    expect(array).toContain(2);
  });

  it('should handle objects', () => {
    const obj = { name: 'Test', value: 123 };
    expect(obj).toHaveProperty('name');
    expect(obj.name).toBe('Test');
    expect(obj.value).toBe(123);
  });
}); 