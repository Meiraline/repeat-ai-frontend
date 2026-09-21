import { http, HttpResponse, delay } from 'msw';
import { z } from 'zod';
import { env } from '@/shared/config/env';
import {
  tutorSendSchema,
  defaultMentorPreferences,
  mentorPreferencesSchema,
  type TutorThread,
} from '@/features/tutor';
import { mockAuthenticated, mockUnauthorized } from './auth';
import { findLearning } from '../fixtures/learning-store';
import { resolveMentorDemoBehavior, mentorDemoAdditions } from '../fixtures/mentor-behavior';
import { applyMentorDemoStyle } from '../fixtures/mentor-style';
import { mentorTeachingSamples } from '../fixtures/mentor-teaching';
type RecordData = {
  threads: TutorThread[];
  creates: Record<string, { fingerprint: string; id: string }>;
};
const storageKey = () =>
  `repeat-preview-tutor:${sessionStorage.getItem('repeat-preview-identity')}`;
const read = (): Record<string, RecordData> =>
  JSON.parse(sessionStorage.getItem(storageKey()) ?? '{}');
const write = (db: Record<string, RecordData>) =>
  sessionStorage.setItem(storageKey(), JSON.stringify(db));
const base = `${env.apiBaseUrl}/__preview/tracks/:id/tutor`;
const ok = (data: unknown) => HttpResponse.json({ data });
const fail = (message: string, status: number) =>
  HttpResponse.json(
    {
      error: {
        code: status === 409 ? 'CONTEXT_CONFLICT' : 'TUTOR_ERROR',
        message,
        retryable: status === 503,
      },
    },
    { status },
  );
export const tutorHandlers = [
  http.get(base, ({ params }) => {
    if (!mockAuthenticated()) return mockUnauthorized();
    const record = findLearning(String(params.id))?.record;
    if (!record) return fail('Курс не найден.', 404);
    return ok({
      trackId: record.track.id,
      title: record.track.title,
      contextVersion: record.track.planVersion,
      topics: record.track.modules
        .flatMap((m) => m.topics)
        .filter((t) => t.status !== 'locked')
        .map((t) => ({ id: t.id, title: t.title })),
      threads: read()[String(params.id)]?.threads ?? [],
    });
  }),
  http.post(`${base}/threads`, async ({ params, request }) => {
    if (!mockAuthenticated()) return mockUnauthorized();
    const parsed = z
      .object({ topicId: z.string().nullable(), contextVersion: z.number().int().positive() })
      .safeParse(await request.json());
    if (!parsed.success) return fail('Проверьте контекст.', 422);
    const id = String(params.id),
      learning = findLearning(id)?.record,
      token = request.headers.get('Idempotency-Key');
    if (!learning) return fail('Курс не найден.', 404);
    if (!token) return fail('Нужен ключ операции.', 400);
    const db = read(),
      data = (db[id] ??= { threads: [], creates: {} }),
      fingerprint = JSON.stringify(parsed.data),
      saved = data.creates[token];
    if (saved)
      return saved.fingerprint === fingerprint
        ? ok(data.threads.find((t) => t.id === saved.id))
        : fail('Ключ уже использован.', 409);
    if (parsed.data.contextVersion !== learning.track.planVersion)
      return fail('Контекст курса изменился. Обновите данные.', 409);
    const topic = parsed.data.topicId ? learning.lessons[parsed.data.topicId]?.topic : null;
    if (parsed.data.topicId && (!topic || topic.status === 'locked'))
      return fail('Тема недоступна.', 403);
    const thread: TutorThread = {
      id: crypto.randomUUID(),
      title: topic?.title ?? 'Весь курс',
      topicId: parsed.data.topicId,
      contextVersion: parsed.data.contextVersion,
      messages: [],
    };
    data.threads.unshift(thread);
    data.creates[token] = { fingerprint, id: thread.id };
    write(db);
    return ok(thread);
  }),
  http.put(`${base}/threads/:thread/context`, async ({ params, request }) => {
    if (!mockAuthenticated()) return mockUnauthorized();
    const parsed = z
      .object({ expectedVersion: z.number().int(), contextVersion: z.number().int() })
      .safeParse(await request.json());
    if (!parsed.success) return fail('Проверьте версию.', 422);
    const id = String(params.id),
      learning = findLearning(id)?.record,
      db = read(),
      thread = db[id]?.threads.find((t) => t.id === params.thread);
    if (!learning || !thread) return fail('Диалог не найден.', 404);
    if (thread.topicId && learning.lessons[thread.topicId]?.topic.status === 'locked')
      return fail('Тема недоступна.', 403);
    if (
      parsed.data.contextVersion !== learning.track.planVersion ||
      (thread.contextVersion !== parsed.data.expectedVersion &&
        thread.contextVersion !== parsed.data.contextVersion)
    )
      return fail('Контекст снова изменился. Обновите данные.', 409);
    thread.contextVersion = parsed.data.contextVersion;
    write(db);
    return ok(thread);
  }),
  http.post(`${base}/threads/:thread/messages`, async ({ params, request }) => {
    if (!mockAuthenticated()) return mockUnauthorized();
    const identity = sessionStorage.getItem('repeat-preview-identity');
    await delay(650);
    if (!mockAuthenticated() || identity !== sessionStorage.getItem('repeat-preview-identity'))
      return mockUnauthorized();
    const parsed = tutorSendSchema.safeParse(await request.json());
    if (!parsed.success) return fail('Сообщение должно содержать от 1 до 8000 символов.', 422);
    const id = String(params.id),
      learning = findLearning(id)?.record,
      db = read(),
      thread = db[id]?.threads.find((t) => t.id === params.thread);
    if (!learning || !thread) return fail('Диалог не найден.', 404);
    const { text, contextVersion, clientMessageId, preferences } = parsed.data;
    if (request.headers.get('Idempotency-Key') !== clientMessageId)
      return fail('Неверный ключ сообщения.', 400);
    if (
      thread.topicId &&
      (!learning.lessons[thread.topicId] ||
        learning.lessons[thread.topicId]?.topic.status === 'locked')
    )
      return fail('Тема недоступна.', 403);
    const existing = thread.messages.find(
      (m) => m.role === 'user' && m.clientMessageId === clientMessageId,
    );
    if (
      existing &&
      (existing.blocks[0]?.type !== 'paragraph' ||
        existing.blocks[0].text !== text ||
        existing.contextVersion !== contextVersion ||
        JSON.stringify(
          mentorPreferencesSchema.parse(existing.preferences ?? defaultMentorPreferences),
        ) !== JSON.stringify(preferences))
    )
      return fail('Ключ сообщения уже использован.', 409);
    const answer = thread.messages.find(
      (m) => m.role === 'assistant' && m.clientMessageId === clientMessageId,
    );
    if (existing && answer?.status === 'complete') return ok(thread);
    if (thread.contextVersion !== contextVersion || learning.track.planVersion !== contextVersion)
      return fail('Контекст курса изменился. Обновите данные и подтвердите новую версию.', 409);
    if (
      thread.messages.some(
        (m) =>
          m.status === 'partial' &&
          m.contextVersion === contextVersion &&
          m.clientMessageId !== clientMessageId,
      )
    )
      return fail('Сначала восстановите неполный ответ.', 409);
    const mode = sessionStorage.getItem('repeat-preview-tutor-response');
    sessionStorage.removeItem('repeat-preview-tutor-response');
    if (mode === 'offline')
      return fail('Соединение прервано. Сообщение не подтверждено; повторите отправку.', 503);
    if (!existing)
      thread.messages.push({
        id: crypto.randomUUID(),
        role: 'user',
        preferences,
        clientMessageId,
        contextVersion,
        status: 'complete',
        blocks: [{ type: 'paragraph', text }],
        sources: [],
      });
    const blocks = [
      {
        type: 'paragraph' as const,
        text: 'Это демонстрационный ответ интерфейса, а не ответ AI. Реальный репетитор пока не подключён.',
      },
      {
        type: 'paragraph' as const,
        text: `Контекст: ${learning.track.title} / ${thread.title}. Сформулируйте, что уже понятно и на каком шаге возникает затруднение.`,
      },
    ];
    const behavior = resolveMentorDemoBehavior(preferences, text);
    const formats = {
      hint: 'Подсказка: начните с определения ключевого понятия.',
      explanation: 'Объяснение: выделите понятие, его применение и связь с темой курса.',
      solution: 'Решение: сформулируйте условие, выберите метод и проверьте результат.',
    };
    const details = { short: 'Кратко', balanced: 'Баланс', detailed: 'Подробно' };
    blocks.push({
      type: 'paragraph',
      text: `Демонстрация настроек · ${details[behavior.detail]}. ${formats[behavior.help]}`,
    });
    if (behavior.detail === 'detailed')
      blocks.push({
        type: 'paragraph',
        text: 'Пример структуры разбора: 1. Что дано? 2. Какой шаг нужен? 3. Как проверить ответ? Это шаблон интерфейса, а не решение вашей задачи.',
      });
    if (behavior.detail === 'short') blocks.splice(1, 1);
    if (preferences.suggestNext)
      blocks.push({
        type: 'paragraph',
        text: 'Следующий вопрос (демонстрация): в какой ситуации можно применить изученное понятие?',
      });
    if (preferences.checkUnderstanding)
      blocks.push({
        type: 'paragraph',
        text: 'Проверка понимания (демонстрация): объясните главную идею своими словами. Автоматическая оценка не выполняется.',
      });
    if (preferences.suggestPractice)
      blocks.push({
        type: 'paragraph',
        text: 'Практика (демонстрация): придумайте свой пример применения темы и опишите три шага решения.',
      });
    blocks.push(...mentorDemoAdditions(preferences));
    blocks.push(...mentorTeachingSamples(preferences));
    const response = {
      id: answer?.id ?? crypto.randomUUID(),
      role: 'assistant' as const,
      preferences,
      clientMessageId,
      contextVersion,
      status: mode === 'partial' ? ('partial' as const) : ('complete' as const),
      blocks: mode === 'partial' ? blocks.slice(0, 1) : applyMentorDemoStyle(blocks, preferences),
      sources: [],
    };
    if (answer) thread.messages[thread.messages.indexOf(answer)] = response;
    else thread.messages.push(response);
    write(db);
    if (mode === 'lost')
      return fail('Ответ потерян после сохранения. Повтор не продублирует сообщение.', 503);
    return ok(thread);
  }),
];
