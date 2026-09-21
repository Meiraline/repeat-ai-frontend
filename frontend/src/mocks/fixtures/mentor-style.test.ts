import { describe, expect, it } from 'vitest';
import { defaultMentorPreferences } from '@/features/tutor';
import type { ContentBlock } from '@/shared/lib/content';
import { applyMentorDemoStyle } from './mentor-style';
describe('mentor style demonstration', () => {
  const original: ContentBlock[] = [{ type: 'paragraph', text: 'Это демонстрация, не ответ AI.' }];
  it('keeps default copy and the disclaimer without mutating history', () => {
    expect(applyMentorDemoStyle(original, defaultMentorPreferences)).toEqual(original);
    applyMentorDemoStyle(original, {
      ...defaultMentorPreferences,
      tone: 'friendly',
      warmth: 'more',
      enthusiasm: 'more',
      emoji: 'more',
      structure: 'more',
    });
    expect(original).toEqual([{ type: 'paragraph', text: 'Это демонстрация, не ответ AI.' }]);
  });
  it('uses structured safe content for headings and lists', () => {
    const output = applyMentorDemoStyle(original, {
      ...defaultMentorPreferences,
      structure: 'more',
      tone: 'friendly',
      emoji: 'more',
    });
    expect(output[0]).toEqual(original[0]);
    expect(output.some((block) => block.type === 'heading')).toBe(true);
    expect(output.some((block) => block.type === 'list')).toBe(true);
    expect(JSON.stringify(output)).toContain('💡');
  });
  it('flattens headings and lists without losing their text', () => {
    expect(
      applyMentorDemoStyle(
        [
          { type: 'heading', text: 'Тема' },
          { type: 'list', items: ['Один', 'Два'] },
        ],
        { ...defaultMentorPreferences, structure: 'less' },
      ),
    ).toEqual([
      { type: 'paragraph', text: 'Тема' },
      { type: 'paragraph', text: 'Один Два' },
    ]);
  });
});
