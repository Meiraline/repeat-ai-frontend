import { describe, it, expect } from 'vitest';
import { validateAnswer, isJobPending } from './plan.schema';
describe('interview and job boundaries', () => {
  it('validates whitespace, finite workload and limits', () => {
    expect(validateAnswer('skill', '  ')).toBeTruthy();
    for (const value of ['0', '-1', '81', 'NaN', 'Infinity', '0.1'])
      expect(validateAnswer('hoursPerWeek', value)).toBeTruthy();
    expect(validateAnswer('hoursPerWeek', '0.5')).toBeUndefined();
    expect(validateAnswer('targetOutcome', 'a'.repeat(2001))).toBeTruthy();
  });
  it('rejects past and malformed dates', () => {
    expect(validateAnswer('targetDate', '2000-01-01')).toBeTruthy();
    expect(validateAnswer('targetDate', 'not a date')).toBeTruthy();
    expect(validateAnswer('targetDate', '2099-12-31')).toBeUndefined();
  });
  it('only polls nonterminal statuses', () => {
    expect(isJobPending('running')).toBe(true);
    expect(isJobPending('queued')).toBe(true);
    for (const s of ['failed', 'partial', 'succeeded', undefined] as const)
      expect(isJobPending(s)).toBe(false);
  });
});
