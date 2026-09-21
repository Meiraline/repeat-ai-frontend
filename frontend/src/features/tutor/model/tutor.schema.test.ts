import { describe, expect, it } from 'vitest';
import { tutorSendSchema } from './tutor.schema';
describe('tutor messages', () => {
  const base = { clientMessageId: '9fdfec34-bf51-4ddd-bfdd-3565e72b0a0f', contextVersion: 1 };
  it('requires bounded non-empty text, a message ID and an explicit context version', () => {
    expect(tutorSendSchema.safeParse({ ...base, text: '  ' }).success).toBe(false);
    expect(tutorSendSchema.safeParse({ ...base, text: 'x'.repeat(8001) }).success).toBe(false);
    expect(tutorSendSchema.safeParse({ ...base, text: 'hello', contextVersion: 0 }).success).toBe(
      false,
    );
    expect(tutorSendSchema.parse({ ...base, text: ' hello\nworld ' }).text).toBe('hello\nworld');
  });
});
