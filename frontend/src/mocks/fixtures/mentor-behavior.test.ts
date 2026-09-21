import { describe, expect, it } from 'vitest';
import { defaultMentorPreferences as defaults } from '@/features/tutor';
import { mentorDemoAdditions, resolveMentorDemoBehavior } from './mentor-behavior';

describe('mentor preview behavior', () => {
  it('keeps default behavior and adds no unsolicited content', () => {
    expect(resolveMentorDemoBehavior(defaults, 'Вопрос')).toEqual({
      help: 'hint',
      detail: 'balanced',
    });
    expect(mentorDemoAdditions(defaults)).toEqual([]);
  });
  it('shortens only balanced single-line short requests', () => {
    const preferences = { ...defaults, quickAnswers: true };
    expect(resolveMentorDemoBehavior(preferences, 'Вопрос').detail).toBe('short');
    expect(resolveMentorDemoBehavior(preferences, 'я'.repeat(121)).detail).toBe('balanced');
    expect(resolveMentorDemoBehavior(preferences, 'Первое\nВторое').detail).toBe('balanced');
    expect(resolveMentorDemoBehavior({ ...preferences, detail: 'detailed' }, 'Вопрос').detail).toBe(
      'detailed',
    );
  });
  it('guides first unless the entire message explicitly requests a solution', () => {
    const preferences = { ...defaults, help: 'solution' as const, guideFirst: true };
    expect(resolveMentorDemoBehavior(preferences, 'Помоги с темой').help).toBe('hint');
    expect(resolveMentorDemoBehavior(preferences, ' Покажите полное решение! ').help).toBe(
      'solution',
    );
    expect(resolveMentorDemoBehavior(preferences, 'Не покажи решение').help).toBe('hint');
    expect(preferences.help).toBe('solution');
  });
  it('adds independently controlled, explicitly labelled examples', () => {
    expect(mentorDemoAdditions({ ...defaults, useAnalogies: true })).toHaveLength(1);
    expect(mentorDemoAdditions({ ...defaults, askClarifying: true })[0]?.text).toContain(
      'Уточнение (демонстрация)',
    );
    expect(
      mentorDemoAdditions({ ...defaults, useAnalogies: true, askClarifying: true }),
    ).toHaveLength(2);
  });
});
