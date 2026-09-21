import type { MentorPreferences } from '@/features/tutor';

// Deterministic preview rules, not semantic analysis of a real task.
export function resolveMentorDemoBehavior(preferences: MentorPreferences, text: string) {
  const request = text.trim();
  const explicitSolution =
    /^(?:покажи(?:те)?|дай(?:те)?)\s+(?:полное\s+|готовое\s+)?решение[.!?]?$/iu.test(request);
  return {
    help: preferences.guideFirst
      ? explicitSolution
        ? ('solution' as const)
        : ('hint' as const)
      : preferences.help,
    detail:
      preferences.quickAnswers &&
      preferences.detail === 'balanced' &&
      request.length <= 120 &&
      !/[\r\n]/u.test(request)
        ? ('short' as const)
        : preferences.detail,
  };
}

export function mentorDemoAdditions(preferences: MentorPreferences) {
  const blocks: { type: 'paragraph'; text: string }[] = [];
  if (preferences.useAnalogies)
    blocks.push({
      type: 'paragraph',
      text: 'Аналогия (демонстрация): изучение темы похоже на сборку конструктора — сначала отдельные детали, затем связи между ними. Это общий пример, не объяснение вашей задачи.',
    });
  if (preferences.askClarifying)
    blocks.push({
      type: 'paragraph',
      text: 'Уточнение (демонстрация): какой шаг вызывает затруднение и что вы уже пробовали? В деморежиме этот вопрос добавляется к каждому ответу при включённой настройке.',
    });
  return blocks;
}
