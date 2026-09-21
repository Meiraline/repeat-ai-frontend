import type { MentorPreferences } from '@/features/tutor';

// Preview samples only: no language detection, grading or semantic generation.
export function mentorTeachingSamples(preferences: MentorPreferences) {
  const english = preferences.responseLanguage === 'en';
  const prompts = english
    ? {
        gentle: 'Try one small step. You can revise it later.',
        balanced: 'Explain your approach and check the result.',
        strict: 'Justify each step, state your assumptions and check for errors.',
      }
    : {
        gentle: 'Попробуйте один небольшой шаг. Его можно уточнить позже.',
        balanced: 'Объясните свой подход и проверьте результат.',
        strict: 'Обоснуйте каждый шаг, укажите допущения и проверьте ошибки.',
      };
  const examples = english
    ? [
        'To compare two methods, apply both to the same simple case.',
        'To check a rule, try a boundary case where its assumptions may fail.',
      ]
    : [
        'Чтобы сравнить два метода, примените оба к одному простому случаю.',
        'Чтобы проверить правило, рассмотрите граничный случай, в котором его условия могут нарушиться.',
      ];
  const count = { less: 0, normal: 1, more: 2 }[preferences.exampleFrequency];
  return [
    {
      type: 'paragraph' as const,
      text: `Требовательность (демонстрация): ${prompts[preferences.strictness]}`,
    },
    ...examples.slice(0, count).map((text, index) => ({
      type: 'paragraph' as const,
      text: `Учебный пример ${index + 1} (демонстрация): ${text}`,
    })),
  ];
}
