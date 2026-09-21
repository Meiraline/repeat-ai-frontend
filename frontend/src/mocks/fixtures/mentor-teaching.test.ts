import { expect, it } from 'vitest';
import { defaultMentorPreferences as defaults, mentorPreferencesSchema } from '@/features/tutor';
import { mentorTeachingSamples } from './mentor-teaching';

it('migrates older snapshots and rejects unsupported teaching settings', () => {
  expect(
    mentorPreferencesSchema.parse({ persona: 'lira', help: 'hint', detail: 'balanced' }),
  ).toEqual(defaults);
  for (const field of ['responseLanguage', 'strictness', 'exampleFrequency'])
    expect(mentorPreferencesSchema.safeParse({ ...defaults, [field]: 'unsupported' }).success).toBe(
      false,
    );
});
it('uses Russian for course fallback and English for the teaching samples', () => {
  expect(mentorTeachingSamples(defaults)).toEqual(
    mentorTeachingSamples({ ...defaults, responseLanguage: 'ru' }),
  );
  expect(mentorTeachingSamples({ ...defaults, responseLanguage: 'en' })[1]?.text).toContain(
    'To compare two methods',
  );
});
it('controls sample count independently of analogy and answer length', () => {
  for (const [frequency, count] of [
    ['less', 1],
    ['normal', 2],
    ['more', 3],
  ] as const)
    expect(
      mentorTeachingSamples({
        ...defaults,
        exampleFrequency: frequency,
        detail: 'short',
        useAnalogies: true,
      }),
    ).toHaveLength(count);
});
it('changes guidance without mutating saved preferences', () => {
  const preferences = { ...defaults, strictness: 'strict' as const };
  expect(mentorTeachingSamples(preferences)[0]?.text).toContain('Обоснуйте каждый шаг');
  expect(mentorTeachingSamples({ ...defaults, strictness: 'gentle' })[0]?.text).toContain(
    'один небольшой шаг',
  );
  expect(preferences.strictness).toBe('strict');
});
