import type { LearningTrack, Lesson } from '@/features/learning';
import type { Knowledge } from '@/features/knowledge';
import { approvedReviews } from './review-store';
export type LearningRecord = {
  track: LearningTrack;
  lessons: Record<string, Lesson>;
  knowledge: Knowledge;
  operations: Record<string, { fingerprint: string; response: unknown }>;
};
const key = () =>
  `repeat-preview-learning:${sessionStorage.getItem('repeat-preview-identity') ?? 'anonymous'}`;
export const readLearning = (): Record<string, LearningRecord> =>
  JSON.parse(sessionStorage.getItem(key()) ?? '{}');
export const writeLearning = (db: Record<string, LearningRecord>) =>
  sessionStorage.setItem(key(), JSON.stringify(db));
export function findLearning(id: string) {
  const db = readLearning();
  const review = approvedReviews().find((r) => r.track?.id === id);
  if (!review) return null;
  if (db[id]) return { db, record: db[id]! };
  const topics = review.program.topics.map((t, i) => ({
    id: t.id,
    title: t.title,
    status: i === 0 ? ('available' as const) : ('locked' as const),
    progressPercent: 0,
    lockReason: i === 0 ? null : 'Сначала пройдите контрольную точку предыдущей темы.',
  }));
  const lessons: Record<string, Lesson> = {};
  for (const topic of topics) {
    const source = review.program.topics.find((t) => t.id === topic.id)!;
    lessons[topic.id] = {
      topic: { ...topic, outcome: source.description },
      examAccess: { allowed: false, reason: 'Сначала изучите обязательные материалы.' },
      materials: [
        {
          id: `${topic.id}-notes`,
          title: 'Демонстрационный конспект',
          type: 'Конспект',
          url: null,
          verificationStatus: 'unverified',
          completed: false,
          required: true,
          version: 1,
          blocks: [
            {
              type: 'paragraph',
              text: 'Это демонстрационный материал интерфейса. Полный учебный контент и проверенные источники появятся после подключения сервиса.',
            },
            { type: 'heading', text: topic.title },
            { type: 'paragraph', text: source.description },
            {
              type: 'list',
              items: [
                'Сформулируйте ключевые понятия темы своими словами.',
                'Приведите пример применения к вашей цели.',
                'Запишите вопросы для дальнейшего изучения.',
              ],
            },
          ],
        },
        {
          id: `${topic.id}-practice`,
          title: 'Самостоятельная практика',
          type: 'Практика',
          url: null,
          verificationStatus: 'unverified',
          completed: false,
          required: true,
          version: 1,
          blocks: [
            {
              type: 'paragraph',
              text: `Составьте краткий план применения темы «${topic.title}» к вашей цели: ${review.program.goal}`,
            },
            {
              type: 'paragraph',
              text: 'Отметка материала означает вашу самооценку, а не сдачу экзамена.',
            },
          ],
        },
        ...source.sources.map((s, i) => ({
          id: `${topic.id}-source-${i}`,
          title: s.title,
          type: 'Источник',
          url: s.url,
          verificationStatus: s.verified ? ('verified' as const) : ('unverified' as const),
          completed: false,
          required: false,
          version: 1,
          blocks: [],
        })),
      ],
    };
  }
  const record: LearningRecord = {
    track: {
      id,
      title: review.program.title,
      planId: review.id,
      planVersion: review.version,
      version: 1,
      progressPercent: 0,
      currentTopicId: topics[0]?.id ?? null,
      modules: [{ id: 'program', title: 'Учебная программа', topics }],
    },
    lessons,
    knowledge: {
      trackId: id,
      title: review.program.title,
      planVersion: review.version,
      entries: topics.flatMap((t) => [
        {
          id: `q-${t.id}`,
          topicId: t.id,
          topicTitle: t.title,
          kind: 'question' as const,
          title: `Как применить тему «${t.title}» к своей цели?`,
          blocks: [
            { type: 'paragraph' as const, text: lessons[t.id]!.topic.outcome },
            {
              type: 'paragraph' as const,
              text: 'Сопоставьте свой ответ с целью темы. Это демонстрационная самопроверка, без AI-оценки и влияния на экзамен.',
            },
          ],
          url: null,
          verificationStatus: 'unverified' as const,
          rating: 'unseen' as const,
          version: 1,
        },
        ...lessons[t.id]!.materials.filter((m) => m.url).map((m) => ({
          id: `s-${m.id}`,
          topicId: t.id,
          topicTitle: t.title,
          kind: 'source' as const,
          title: m.title,
          blocks: m.blocks,
          url: m.url,
          verificationStatus: m.verificationStatus,
          rating: 'unseen' as const,
          version: 1,
        })),
      ]),
    },
    operations: {},
  };
  db[id] = record;
  writeLearning(db);
  return { db, record };
}
export function updateLearningProgress(record: LearningRecord) {
  const all = Object.values(record.lessons).flatMap((l) => l.materials.filter((m) => m.required));
  record.track.progressPercent = all.length
    ? Math.round((all.filter((m) => m.completed).length / all.length) * 100)
    : 0;
  for (const module of record.track.modules)
    for (const topic of module.topics) {
      const lesson = record.lessons[topic.id]!;
      const materials = lesson.materials.filter((m) => m.required);
      topic.progressPercent = materials.length
        ? Math.round((materials.filter((m) => m.completed).length / materials.length) * 100)
        : 0;
      if (topic.status !== 'locked' && topic.status !== 'passed')
        topic.status =
          topic.progressPercent === 100
            ? 'ready_for_exam'
            : topic.progressPercent > 0
              ? 'in_progress'
              : 'available';
      Object.assign(lesson.topic, topic);
      lesson.examAccess = {
        allowed: topic.status === 'ready_for_exam',
        reason:
          topic.status === 'ready_for_exam' ? null : 'Сначала изучите обязательные материалы.',
      };
    }
  record.track.version++;
}
