import type { Attempt, AssessmentKind } from '@/features/assessments';
import { findLearning, writeLearning } from './learning-store';
export type StoredAttempt = Attempt & {
  submittedAt: number | null;
  outcome: 'passed' | 'failed' | 'review_required' | null;
};
export type AssessmentRecord = {
  attempts: StoredAttempt[];
  operations: Record<string, { fingerprint: string; attemptId: string }>;
};
export type DiplomaRecord = {
  id: string;
  name: string;
  requestedAt: number;
  status: 'generating' | 'ready';
  key: string;
};
export type AssessmentDatabase = Record<
  string,
  { assessments: Record<string, AssessmentRecord>; diploma?: DiplomaRecord }
>;
const key = () => `repeat-preview-assessments:${sessionStorage.getItem('repeat-preview-identity')}`;
export const readAssessments = (): AssessmentDatabase =>
  JSON.parse(sessionStorage.getItem(key()) ?? '{}');
export const writeAssessments = (db: AssessmentDatabase) =>
  sessionStorage.setItem(key(), JSON.stringify(db));
export function access(id: string, kind: AssessmentKind, target: string) {
  const learning = findLearning(id)?.record;
  if (!learning) return null;
  const topic = learning.lessons[target]?.topic;
  if (kind === 'exam' && !topic) return null;
  if (kind === 'project' && target !== 'final') return null;
  const allowed =
    kind === 'exam'
      ? topic?.status === 'ready_for_exam'
      : learning.track.modules.flatMap((m) => m.topics).every((t) => t.status === 'passed');
  return {
    title:
      kind === 'exam' ? `Экзамен · ${topic!.title}` : `Итоговый проект · ${learning.track.title}`,
    allowed,
    reason: allowed
      ? null
      : kind === 'exam'
        ? 'Изучите обязательные материалы и пройдите предыдущие контрольные точки.'
        : 'Сначала пройдите экзамены по всем темам.',
    planVersion: learning.track.planVersion,
  };
}
export function newAttempt(kind: AssessmentKind, planVersion: number): StoredAttempt {
  return {
    id: crypto.randomUUID(),
    version: 1,
    planVersion,
    status: 'active',
    dueAt: null,
    submittedAt: null,
    outcome: null,
    answers: {},
    project: { description: '', url: '' },
    feedback: [],
    questions:
      kind === 'project'
        ? []
        : [
            {
              id: 'q1',
              type: 'single',
              title: 'Демонстрационный вопрос: какое действие подтверждает результат проверки?',
              options: [
                { id: 'a', text: 'Открытие страницы' },
                { id: 'b', text: 'Получение итогового статуса проверки' },
              ],
            },
            {
              id: 'q2',
              type: 'multiple',
              title: 'Выберите действия, полезные перед сдачей работы.',
              options: [
                { id: 'a', text: 'Проверить требования' },
                { id: 'b', text: 'Проверить сохранение ответов' },
                { id: 'c', text: 'Закрыть страницу до сохранения' },
              ],
            },
            {
              id: 'q3',
              type: 'short',
              title: 'Введите слово «пример» для проверки короткого ответа.',
              options: [],
            },
            {
              id: 'q4',
              type: 'free',
              title:
                'Опишите своими словами, как вы проверили бы результат работы. В тестовом режиме достаточно 20 символов; реальная проверка по критериям ещё не подключена.',
              options: [],
            },
          ],
  };
}
export function settleAttempt(
  id: string,
  kind: AssessmentKind,
  target: string,
  attempt: StoredAttempt,
) {
  if (attempt.status === 'active' && attempt.dueAt && Date.now() >= Date.parse(attempt.dueAt)) {
    attempt.status = 'expired';
    attempt.version++;
  }
  if (!['submitted', 'evaluating'].includes(attempt.status) || !attempt.submittedAt) return;
  const elapsed = Date.now() - attempt.submittedAt;
  if (elapsed < 1200) return;
  if (elapsed < 3000) {
    if (attempt.status !== 'evaluating') {
      attempt.status = 'evaluating';
      attempt.version++;
    }
    return;
  }
  attempt.status = attempt.outcome ?? 'review_required';
  attempt.version++;
  const learning = findLearning(id);
  if (!learning || learning.record.track.planVersion !== attempt.planVersion) {
    attempt.status = 'review_required';
    attempt.feedback = ['Программа изменилась. Результат требует дополнительной проверки.'];
    return;
  }
  attempt.feedback =
    attempt.status === 'passed'
      ? ['Демонстрационная проверка завершена. Тестовый критерий выполнен.']
      : attempt.status === 'review_required'
        ? [
            'Результат неоднозначен. Автоматическое открытие следующего этапа запрещено; нужна дополнительная проверка.',
          ]
        : [
            'Тестовый критерий не выполнен. Проверьте ответы или дополните описание и начните новую попытку.',
          ];
  if (attempt.status === 'passed' && kind === 'exam') {
    const found = findLearning(id);
    if (!found || found.record.track.planVersion !== attempt.planVersion) {
      attempt.status = 'review_required';
      attempt.feedback = ['Программа изменилась. Результат требует дополнительной проверки.'];
      return;
    }
    const topics = found.record.track.modules.flatMap((m) => m.topics),
      index = topics.findIndex((t) => t.id === target),
      topic = topics[index];
    if (topic) {
      topic.status = 'passed';
      Object.assign(found.record.lessons[target]!.topic, topic);
      found.record.lessons[target]!.examAccess = { allowed: false, reason: 'Экзамен уже пройден.' };
    }
    const next = topics[index + 1];
    if (next?.status === 'locked') {
      next.status = 'available';
      next.lockReason = null;
      Object.assign(found.record.lessons[next.id]!.topic, next);
    }
    found.record.track.currentTopicId = next?.id ?? target;
    found.record.track.version++;
    writeLearning(found.db);
  }
}
