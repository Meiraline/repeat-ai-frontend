import { http, HttpResponse, delay } from 'msw';
import { z } from 'zod';
import { env } from '@/shared/config/env';
import {
  answerSchema,
  projectDraftSchema,
  isAnswered,
  type AssessmentKind,
} from '@/features/assessments';
import { mockAuthenticated, mockUnauthorized } from './auth';
import {
  access,
  newAttempt,
  readAssessments,
  writeAssessments,
  settleAttempt,
} from '../fixtures/assessment-store';
const base = `${env.apiBaseUrl}/__preview/tracks/:id/assessments/:kind/:target`;
const ok = (data: unknown) => HttpResponse.json({ data });
const fail = (message: string, status: number) =>
  HttpResponse.json(
    {
      error: {
        code: status === 409 ? 'VERSION_CONFLICT' : 'ASSESSMENT_ERROR',
        message,
        retryable: status === 503,
      },
    },
    { status },
  );
const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('start') }),
  z.object({
    action: z.literal('save'),
    attemptId: z.string(),
    expectedVersion: z.number().int(),
    answers: z.record(z.string(), answerSchema),
    project: projectDraftSchema,
  }),
  z.object({
    action: z.literal('submit'),
    attemptId: z.string(),
    expectedVersion: z.number().int(),
    allowUnanswered: z.boolean(),
  }),
]);
export const assessmentHandlers = [
  http.get(base, ({ params }) => {
    if (!mockAuthenticated()) return mockUnauthorized();
    const id = String(params.id),
      kind = String(params.kind) as AssessmentKind,
      target = String(params.target);
    if (!['exam', 'project'].includes(kind)) return fail('Проверка не найдена.', 404);
    const intro = access(id, kind, target);
    if (!intro) return fail('Проверка не найдена.', 404);
    const db = readAssessments(),
      record = db[id]?.assessments[`${kind}:${target}`],
      attempt = record?.attempts.at(-1) ?? null;
    if (attempt) {
      settleAttempt(id, kind, target, attempt);
      writeAssessments(db);
    }
    return ok({
      ...access(id, kind, target),
      requirements:
        kind === 'project'
          ? [
              'Опишите цель, выполненные шаги и результат.',
              'Укажите ограничения и способ проверки результата.',
              'Ссылка на результат необязательна. Файлы пока не поддерживаются.',
            ]
          : [
              'Демонстрационный экзамен: четыре типа вопросов.',
              'Отправка блокирует редактирование. Пропуски требуют подтверждения.',
              'Таймер появится только при наличии срока попытки от сервера.',
            ],
      attempt,
      history: record?.attempts.map((a) => ({ id: a.id, status: a.status })) ?? [],
    });
  }),
  http.post(base, async ({ params, request }) => {
    if (!mockAuthenticated()) return mockUnauthorized();
    const identity = sessionStorage.getItem('repeat-preview-identity');
    await delay(180);
    if (!mockAuthenticated() || identity !== sessionStorage.getItem('repeat-preview-identity'))
      return mockUnauthorized();
    const id = String(params.id),
      kind = String(params.kind) as AssessmentKind,
      target = String(params.target);
    if (!['exam', 'project'].includes(kind)) return fail('Проверка не найдена.', 404);
    const intro = access(id, kind, target);
    if (!intro) return fail('Проверка не найдена.', 404);
    const parsed = actionSchema.safeParse(await request.json()),
      token = request.headers.get('Idempotency-Key');
    if (!parsed.success || !token) return fail('Проверьте данные запроса.', 422);
    const body = parsed.data,
      db = readAssessments(),
      track = (db[id] ??= { assessments: {} }),
      record = (track.assessments[`${kind}:${target}`] ??= { attempts: [], operations: {} }),
      fingerprint = JSON.stringify(body),
      saved = record.operations[token];
    if (saved)
      return saved.fingerprint === fingerprint
        ? ok(record.attempts.find((a) => a.id === saved.attemptId))
        : fail('Ключ операции уже использован.', 409);
    let attempt = record.attempts.at(-1);
    if (body.action === 'start') {
      if (attempt && ['active', 'submitted', 'evaluating'].includes(attempt.status)) {
        settleAttempt(id, kind, target, attempt);
      } else {
        if (!intro.allowed || attempt?.status === 'passed' || attempt?.status === 'review_required')
          return fail(intro.reason ?? 'Проверка уже пройдена.', 403);
        attempt = newAttempt(kind, intro.planVersion);
        record.attempts.push(attempt);
      }
    } else {
      if (!attempt || attempt.id !== body.attemptId) return fail('Попытка не найдена.', 404);
      settleAttempt(id, kind, target, attempt);
      writeAssessments(db);
      if (attempt.status !== 'active')
        return fail('Редактирование этой попытки закрыто. Обновите результат.', 409);
      if (attempt.planVersion !== intro.planVersion || attempt.version !== body.expectedVersion)
        return fail('Версия изменилась. Загрузите сохранённую попытку.', 409);
      if (body.action === 'save') {
        if (sessionStorage.getItem('repeat-preview-assessment-response') === 'offline-save') {
          sessionStorage.removeItem('repeat-preview-assessment-response');
          return fail('Не удалось сохранить: соединение прервано. Текст остаётся в форме.', 503);
        }
        for (const [qid, value] of Object.entries(body.answers)) {
          const q = attempt.questions.find((q) => q.id === qid);
          if (
            !q ||
            (q.type === 'multiple'
              ? !Array.isArray(value) ||
                new Set(value).size !== value.length ||
                value.some((v) => !q.options.some((o) => o.id === v))
              : typeof value !== 'string' ||
                (q.type === 'single' && !!value && !q.options.some((o) => o.id === value)))
          )
            return fail('Неверный формат ответа.', 422);
        }
        attempt.answers = body.answers;
        attempt.project = body.project;
      } else {
        if (
          kind === 'exam' &&
          !body.allowUnanswered &&
          attempt.questions.some((q) => !isAnswered(attempt!.answers[q.id]))
        )
          return fail('Подтвердите сдачу с пропусками.', 422);
        if (kind === 'project' && attempt.project.description.trim().length < 30)
          return fail('Добавьте описание результата: не менее 30 символов.', 422);
        const mode = sessionStorage.getItem('repeat-preview-assessment-outcome');
        sessionStorage.removeItem('repeat-preview-assessment-outcome');
        const a = attempt.answers;
        const passed =
          kind === 'project' ||
          (a.q1 === 'b' &&
            Array.isArray(a.q2) &&
            [...a.q2].sort().join(',') === 'a,b' &&
            typeof a.q3 === 'string' &&
            a.q3.trim().toLocaleLowerCase('ru') === 'пример' &&
            typeof a.q4 === 'string' &&
            a.q4.trim().length >= 20);
        attempt.outcome =
          mode === 'review_required'
            ? 'review_required'
            : mode === 'failed'
              ? 'failed'
              : passed
                ? 'passed'
                : 'failed';
        attempt.status = 'submitted';
        attempt.submittedAt = Date.now();
      }
      attempt.version++;
    }
    record.operations[token] = { fingerprint, attemptId: attempt!.id };
    writeAssessments(db);
    if (sessionStorage.getItem('repeat-preview-assessment-response') === body.action) {
      sessionStorage.removeItem('repeat-preview-assessment-response');
      return fail('Ответ потерян после сохранения. Повторите действие.', 503);
    }
    return ok(attempt);
  }),
];
