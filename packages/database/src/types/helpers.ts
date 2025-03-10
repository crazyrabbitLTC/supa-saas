/**
 * @file Type Helpers
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Helper types for converting between snake_case and camelCase.
 * 
 * IMPORTANT:
 * - Use these types when working with Supabase data
 * - They help maintain consistent naming conventions
 * 
 * Functionality:
 * - Converts snake_case database fields to camelCase TypeScript properties
 * - Converts camelCase TypeScript properties to snake_case database fields
 */

// Type to convert snake_case to camelCase
export type SnakeToCamel<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamel<U>>}`
  : S;

// Type to convert object keys from snake_case to camelCase
export type SnakeToCamelObject<T> = {
  [K in keyof T as K extends string ? SnakeToCamel<K> : K]: T[K] extends object
    ? SnakeToCamelObject<T[K]>
    : T[K];
};

// Type to convert camelCase to snake_case
export type CamelToSnake<S extends string> = S extends `${infer T}${infer U}`
  ? T extends Capitalize<T>
    ? `_${Lowercase<T>}${CamelToSnake<U>}`
    : `${T}${CamelToSnake<U>}`
  : S;

// Type to convert object keys from camelCase to snake_case
export type CamelToSnakeObject<T> = {
  [K in keyof T as K extends string ? CamelToSnake<K> : K]: T[K] extends object
    ? CamelToSnakeObject<T[K]>
    : T[K];
};

// Helper function to convert snake_case object to camelCase
export function snakeToCamel<T extends Record<string, any>>(obj: T): SnakeToCamelObject<T> {
  const result: any = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = obj[key];
    }
  }
  
  return result as SnakeToCamelObject<T>;
}

// Helper function to convert camelCase object to snake_case
export function camelToSnake<T extends Record<string, any>>(obj: T): CamelToSnakeObject<T> {
  const result: any = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = obj[key];
    }
  }
  
  return result as CamelToSnakeObject<T>;
} 