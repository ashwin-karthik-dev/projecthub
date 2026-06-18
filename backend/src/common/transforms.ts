/**
 * Reusable, type-safe `class-transformer` transform callbacks.
 * Typing `value` as `unknown` avoids `no-unsafe-*` lint errors that arise
 * because class-transformer types the transform value as `any`.
 */
export const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export const normalizeEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;
