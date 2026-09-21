import { describe, it, expect } from 'vitest';
import { safeSourceUrl } from './content';
describe('source URL boundary', () => {
  it('accepts only absolute http(s) URLs without embedded credentials', () => {
    for (const value of [
      'javascript:alert(1)',
      'data:text/html,test',
      'file:///etc/passwd',
      '//evil.test',
      'https://user:secret@example.test/',
    ])
      expect(safeSourceUrl(value)).toBeNull();
    expect(safeSourceUrl('https://example.test/docs')).toBe('https://example.test/docs');
  });
});
