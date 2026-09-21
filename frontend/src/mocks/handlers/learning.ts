import { http, HttpResponse, delay } from 'msw';
import { z } from 'zod';
import { env } from '@/shared/config/env';
import { mockAuthenticated, mockUnauthorized } from './auth';
import { findLearning, writeLearning, updateLearningProgress } from '../fixtures/learning-store';
const base = `${env.apiBaseUrl}/__preview/tracks/:id`;
const ok = (data: unknown) => HttpResponse.json({ data });
const fail = (message: string, status: number) =>
  HttpResponse.json(
    {
      error: {
        code:
          status === 409
            ? 'VERSION_CONFLICT'
            : status === 403
              ? 'PREREQUISITE_LOCKED'
              : 'LEARNING_ERROR',
        message,
        retryable: status === 503,
      },
    },
    { status },
  );
export const learningHandlers = [
  http.get(base, ({ params }) => {
    if (!mockAuthenticated()) return mockUnauthorized();
    const result = findLearning(String(params.id));
    return result ? ok(result.record.track) : fail('Учебный трек не найден.', 404);
  }),
  http.get(`${base}/topics/:topic`, ({ params }) => {
    if (!mockAuthenticated()) return mockUnauthorized();
    const lesson = findLearning(String(params.id))?.record.lessons[String(params.topic)];
    return !lesson
      ? fail('Тема не найдена.', 404)
      : lesson.topic.status === 'locked'
        ? fail(lesson.topic.lockReason ?? 'Тема заблокирована.', 403)
        : ok(lesson);
  }),
  http.get(`${base}/knowledge`, ({ params }) => {
    if (!mockAuthenticated()) return mockUnauthorized();
    const result = findLearning(String(params.id));
    return result ? ok(result.record.knowledge) : fail('База знаний не найдена.', 404);
  }),
  ...['materials', 'knowledge'].map((kind) =>
    http.put(
      kind === 'materials' ? `${base}/topics/:topic/materials/:item` : `${base}/knowledge/:item`,
      async ({ params, request }) => {
        if (!mockAuthenticated()) return mockUnauthorized();
        const identity = sessionStorage.getItem('repeat-preview-identity');
        await delay(180);
        if (!mockAuthenticated() || identity !== sessionStorage.getItem('repeat-preview-identity'))
          return mockUnauthorized();
        const body = await request.json();
        const parsed = (
          kind === 'materials'
            ? z.object({ completed: z.boolean(), expectedVersion: z.number().int().positive() })
            : z.object({
                rating: z.enum(['repeat', 'known']),
                expectedVersion: z.number().int().positive(),
              })
        ).safeParse(body);
        if (!parsed.success) return fail('Проверьте запрос.', 422);
        const result = findLearning(String(params.id)),
          token = request.headers.get('Idempotency-Key');
        if (!result) return fail('Трек не найден.', 404);
        if (!token) return fail('Нужен ключ операции.', 400);
        const { db, record } = result,
          fingerprint = JSON.stringify([request.url, parsed.data]),
          saved = record.operations[token];
        if (saved)
          return saved.fingerprint === fingerprint
            ? ok(saved.response)
            : fail('Ключ уже использован.', 409);
        let response: unknown;
        if (kind === 'materials' && 'completed' in parsed.data) {
          const lesson = record.lessons[String(params.topic)],
            material = lesson?.materials.find((m) => m.id === params.item);
          if (!material) return fail('Материал не найден.', 404);
          if (lesson!.topic.status === 'locked')
            return fail('Тема заблокирована. Пройдите предыдущую контрольную точку.', 403);
          if (material.version !== parsed.data.expectedVersion)
            return fail('Прогресс изменился. Загрузите сохранённую версию перед повтором.', 409);
          material.completed = parsed.data.completed;
          material.version++;
          updateLearningProgress(record);
          response = lesson;
        } else if ('rating' in parsed.data) {
          const entry = record.knowledge.entries.find((e) => e.id === params.item);
          if (!entry || entry.kind !== 'question') return fail('Вопрос не найден.', 404);
          if (entry.version !== parsed.data.expectedVersion)
            return fail('Самооценка изменилась. Обновите базу знаний.', 409);
          entry.rating = parsed.data.rating;
          entry.version++;
          response = entry;
        } else return fail('Неверная операция.', 422);
        record.operations[token] = { fingerprint, response: structuredClone(response) };
        writeLearning(db);
        if (sessionStorage.getItem('repeat-preview-learning-response') === kind) {
          sessionStorage.removeItem('repeat-preview-learning-response');
          return fail('Ответ потерян после сохранения. Повторите действие.', 503);
        }
        return ok(response);
      },
    ),
  ),
];
