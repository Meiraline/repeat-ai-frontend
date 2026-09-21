import type { MentorPreferences } from '@/features/tutor';
import type { ContentBlock } from '@/shared/lib/content';

// Deliberately deterministic demonstration copy, never a substitute for an AI response.
export function applyMentorDemoStyle(
  blocks: ContentBlock[],
  preferences: MentorPreferences,
): ContentBlock[] {
  const additions: ContentBlock[] = [];
  const sentences: string[] = [];
  if (preferences.tone === 'friendly') sentences.push('Давай разберём тему вместе, шаг за шагом.');
  if (preferences.tone === 'concise') sentences.push('Суть: понятие, применение, проверка.');
  if (preferences.warmth === 'more')
    sentences.push('Можно двигаться в своём темпе и возвращаться к сложным местам.');
  if (preferences.warmth === 'less') sentences.push('Перейдём к разбору задачи.');
  if (preferences.enthusiasm === 'more')
    sentences.push('Отлично, попробуем применить идею на практике!');
  if (preferences.enthusiasm === 'less') sentences.push('Рассмотрим тему последовательно.');
  if (preferences.emoji === 'more') sentences.push('💡 Шаг за шагом.');
  if (sentences.length)
    additions.push({
      type: 'paragraph',
      text: `Пример стиля (демонстрация): ${sentences.join(' ')}`,
    });
  if (preferences.structure === 'more')
    additions.push(
      { type: 'heading', text: 'План разбора (демонстрация)' },
      {
        type: 'list',
        items: [
          'Выделить главное понятие.',
          'Рассмотреть пример применения.',
          'Проверить результат.',
        ],
      },
    );
  const result = [...blocks, ...additions];
  if (preferences.structure !== 'less') return result;
  return result.map((block) =>
    block.type === 'heading'
      ? { type: 'paragraph', text: block.text }
      : block.type === 'list'
        ? { type: 'paragraph', text: block.items.join(' ') }
        : block,
  );
}
