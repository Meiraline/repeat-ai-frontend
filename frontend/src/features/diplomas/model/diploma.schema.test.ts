import { expect, it } from 'vitest';
import { diplomaNameSchema } from './diploma.schema';
it('accepts names with letters and separators and rejects markup or empty names', () => {
  expect(diplomaNameSchema.parse('  Анна-Мария Иванова  ')).toBe('Анна-Мария Иванова');
  expect(diplomaNameSchema.safeParse('<script>').success).toBe(false);
  expect(diplomaNameSchema.safeParse(' ').success).toBe(false);
});
