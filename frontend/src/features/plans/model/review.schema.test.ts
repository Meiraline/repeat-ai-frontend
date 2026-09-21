import { describe, it, expect } from 'vitest';
import {
  programDiff,
  sourceGaps,
  reviewActionSchema,
  programSchema,
  type Program,
} from './review.schema';
const program: Program = {
  title: 'Goal',
  goal: 'Build',
  targetDate: '2099-01-01',
  hoursPerWeek: 4,
  formats: 'Video',
  constraints: 'Free',
  topics: [{ id: 'a', title: 'First', description: 'Practice', sources: [] }],
};
describe('plan review boundaries', () => {
  it('shows reordered topics even when their content has not changed', () => {
    const original = structuredClone(program);
    original.topics.push({ ...original.topics[0]!, id: 'b', title: 'Second' });
    const reordered = structuredClone(original);
    reordered.topics.reverse();
    expect(programDiff(original, reordered)).toEqual([
      { title: 'Порядок тем', before: 'First → Second', after: 'Second → First' },
    ]);
  });
  it('includes additions, removals, source changes and parameter changes in the diff', () => {
    const next = structuredClone(program);
    next.hoursPerWeek = 3;
    next.topics = [{ id: 'b', title: 'Second', description: 'New', sources: [] }];
    expect(programDiff(program, next)).toHaveLength(3);
    const linked = structuredClone(program);
    linked.topics[0]!.sources = [
      { title: 'Docs', url: 'https://example.test/docs', verified: false },
    ];
    expect(programDiff(program, linked)).toHaveLength(1);
    expect(sourceGaps(linked)).toHaveLength(1);
    linked.topics[0]!.sources[0]!.verified = true;
    expect(sourceGaps(linked)).toHaveLength(0);
  });
  it('rejects unsafe source URLs and approval without parameter acknowledgement', () => {
    const unsafe = structuredClone(program);
    unsafe.topics[0]!.sources = [{ title: 'Unsafe', url: 'javascript:alert(1)', verified: true }];
    expect(programSchema.safeParse(unsafe).success).toBe(false);
    expect(
      reviewActionSchema.safeParse({
        action: 'approve',
        expectedPlanVersion: 1,
        timezone: 'UTC',
        acknowledgements: { parameters: false, gaps: true },
      }).success,
    ).toBe(false);
  });
});
