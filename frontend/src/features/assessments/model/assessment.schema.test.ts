import { describe, expect, it } from 'vitest';
import { isAnswered, remainingSeconds, projectDraftSchema } from './assessment.schema';
describe('assessment rules at the UI boundary', () => {
  it('derives remaining time from the server deadline, including a suspended tab', () => {
    const due = '2026-09-21T12:00:00Z';
    expect(remainingSeconds(due, Date.parse(due) - 61000)).toBe(61);
    expect(remainingSeconds(due, Date.parse(due) + 30000)).toBe(0);
    expect(remainingSeconds(null)).toBeNull();
  });
  it('counts empty answers without grading and validates optional project links', () => {
    expect([undefined, '', '  ', []].map(isAnswered)).toEqual([false, false, false, false]);
    expect(isAnswered(['a'])).toBe(true);
    expect(
      projectDraftSchema.safeParse({ description: 'Text', url: 'javascript:alert(1)' }).success,
    ).toBe(false);
    expect(projectDraftSchema.safeParse({ description: 'Text', url: '' }).success).toBe(true);
  });
});
