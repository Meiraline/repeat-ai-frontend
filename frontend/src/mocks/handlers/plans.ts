import { http, HttpResponse, delay } from 'msw';
import { env } from '@/shared/config/env';
import {
  emptyBrief,
  fields,
  validateAnswer,
  draftSchema,
  type PlanDraft,
  type PlanJob,
} from '@/features/plans';
import { mockAuthenticated, mockUnauthorized } from './auth';
import { approvedReviews } from '../fixtures/review-store';
type StoredJob = { id: string; draftId: string; startedAt: number; scenario: string };
type Database = { drafts: PlanDraft[]; jobs: StoredJob[]; keys: Record<string, string> };
const key = () =>
  `repeat-preview-plans:${sessionStorage.getItem('repeat-preview-identity') ?? 'anonymous'}`;
const read = (): Database =>
  JSON.parse(sessionStorage.getItem(key()) ?? '{"drafts":[],"jobs":[],"keys":{}}');
const write = (db: Database) => sessionStorage.setItem(key(), JSON.stringify(db));
const ok = (data: unknown, status = 200) => HttpResponse.json({ data }, { status });
const fail = (message: string, status = 409) =>
  HttpResponse.json(
    {
      error: { code: status === 404 ? 'NOT_FOUND' : 'VERSION_CONFLICT', message, retryable: false },
    },
    { status },
  );
function project(job: StoredJob, draft: PlanDraft): PlanJob {
  const elapsed = Date.now() - job.startedAt,
    duration = job.scenario === 'slow' ? 65000 : 7000;
  const stage = Math.min(5, Math.floor(elapsed / (duration / 5))),
    done = stage === 5;
  const status = done
    ? job.scenario === 'failed'
      ? 'failed'
      : job.scenario === 'partial'
        ? 'partial'
        : 'succeeded'
    : stage === 0
      ? 'queued'
      : 'running';
  return {
    id: job.id,
    draftId: job.draftId,
    status,
    stage: status === 'failed' ? 2 : status === 'partial' ? 4 : stage,
    progress: status === 'failed' ? 40 : status === 'partial' ? 80 : stage * 20,
    delayed: elapsed > 15000 && !done,
    message:
      status === 'failed'
        ? 'Не удалось завершить исследование. Ответы сохранены для повторного запуска.'
        : status === 'partial'
          ? 'Часть источников недоступна. Получен неполный черновик.'
          : '',
    topics:
      done && status !== 'failed'
        ? [
            {
              id: '1',
              title: `Основы: ${draft.brief.skill}`,
              description: 'Определить ключевые понятия и выполнить вводную практику.',
            },
            { id: '2', title: 'Практическое применение', description: draft.brief.targetOutcome },
            ...(status === 'partial'
              ? []
              : [
                  {
                    id: '3',
                    title: 'Самопроверка и итоговая работа',
                    description: 'Проверить знания и выполнить самостоятельное задание.',
                  },
                ]),
          ]
        : [],
  };
}
function start(db: Database, draft: PlanDraft, operationKey: string) {
  const job: StoredJob = {
    id: crypto.randomUUID(),
    draftId: draft.id,
    startedAt: Date.now(),
    scenario: sessionStorage.getItem('repeat-preview-generation') ?? 'success',
  };
  db.jobs.push(job);
  db.keys[operationKey] = draft.id;
  draft.jobId = job.id;
  draft.phase = 'generation';
  draft.version++;
  write(db);
  return ok(draft, 202);
}
export function readyPlan(id: string) {
  const db = read(),
    draft = db.drafts.find((d) => d.id === id);
  const job = db.jobs.find((j) => j.id === draft?.jobId);
  if (!draft || !job) return null;
  const result = project(job, draft);
  return ['succeeded', 'partial'].includes(result.status) ? { draft, job: result } : null;
}
export const planHandlers = [
  http.get(`${env.apiBaseUrl}/__preview/plans`, () =>
    mockAuthenticated()
      ? ok(read().drafts.filter((d) => !approvedReviews().some((r) => r.id === d.id)))
      : mockUnauthorized(),
  ),
  http.post(`${env.apiBaseUrl}/__preview/plans`, async ({ request }) => {
    if (!mockAuthenticated()) return mockUnauthorized();
    await delay(120);
    const db = read(),
      token = request.headers.get('Idempotency-Key');
    if (!token) return fail('Нужен ключ операции.', 400);
    const existing = db.drafts.find((d) => d.id === db.keys[token]);
    if (existing) return ok(existing);
    const draft: PlanDraft = {
      id: crypto.randomUUID(),
      version: 1,
      brief: { ...emptyBrief },
      phase: 'interview',
      step: 0,
      acceptedRisk: false,
      risk: null,
      generationKey: crypto.randomUUID(),
      jobId: null,
    };
    db.drafts.unshift(draft);
    db.keys[token] = draft.id;
    write(db);
    return ok(draft, 201);
  }),
  http.get(`${env.apiBaseUrl}/__preview/plans/:id`, ({ params }) => {
    if (!mockAuthenticated()) return mockUnauthorized();
    const draft = read().drafts.find((d) => d.id === params.id);
    return draft ? ok(draft) : fail('Черновик не найден.', 404);
  }),
  http.put(`${env.apiBaseUrl}/__preview/plans/:id`, async ({ params, request }) => {
    if (!mockAuthenticated()) return mockUnauthorized();
    await delay(120);
    const db = read(),
      current = db.drafts.find((d) => d.id === params.id);
    if (!current) return fail('Черновик не найден.', 404);
    if (request.headers.get('If-Match') !== String(current.version))
      return fail(
        'Черновик изменился. Загрузите сохранённую версию перед повтором. Ваш ответ остался в поле.',
      );
    if (current.jobId) return fail('Генерация уже запущена. Откройте её статус.');
    const result = draftSchema.safeParse(await request.json());
    if (!result.success) return fail('Проверьте ответы.', 422);
    const { brief, step, phase, acceptedRisk } = result.data;
    if (phase === 'generation') return fail('Сначала запустите генерацию.', 422);
    if (phase !== 'interview' && fields.some((f) => validateAnswer(f, brief[f])))
      return fail('Заполните все семь ответов.', 422);
    // Deterministic mock assessment, not a real AI estimate.
    const days = (new Date(brief.targetDate).getTime() - Date.now()) / 86400000;
    const risk =
      phase === 'interview'
        ? null
        : days < 84 || Number(brief.hoursPerWeek) < 5
          ? 'high'
          : 'normal';
    if (phase === 'summary' && risk === 'high' && !acceptedRisk)
      return fail('Подтвердите риск срока.', 422);
    const changed = JSON.stringify(brief) !== JSON.stringify(current.brief);
    Object.assign(current, {
      brief,
      step,
      phase,
      risk,
      acceptedRisk: phase === 'interview' && changed ? false : acceptedRisk,
      version: current.version + 1,
      generationKey: crypto.randomUUID(),
    });
    write(db);
    return ok(current);
  }),
  http.post(`${env.apiBaseUrl}/__preview/plans/:id/jobs`, async ({ params, request }) => {
    if (!mockAuthenticated()) return mockUnauthorized();
    await delay(100);
    const db = read(),
      draft = db.drafts.find((d) => d.id === params.id),
      token = request.headers.get('Idempotency-Key');
    if (!draft) return fail('Черновик не найден.', 404);
    if (!token) return fail('Нужен ключ операции.', 400);
    if (db.keys[token] === draft.id && draft.jobId) return ok(draft, 202);
    const body = (await request.json()) as { version: number };
    if (
      body.version !== draft.version ||
      draft.phase !== 'summary' ||
      token !== draft.generationKey
    )
      return fail('Черновик изменился. Обновите сохранённую версию.');
    const response = start(db, draft, token);
    if (sessionStorage.getItem('repeat-preview-start-response') === 'lost') {
      sessionStorage.removeItem('repeat-preview-start-response');
      return fail('Ответ потерян после запуска. Повторите запрос с тем же ключом.', 503);
    }
    return response;
  }),
  http.post(`${env.apiBaseUrl}/__preview/plans/:id/retry`, async ({ params, request }) => {
    if (!mockAuthenticated()) return mockUnauthorized();
    if (approvedReviews().some((r) => r.id === params.id))
      return fail('Программа уже утверждена. Повтор генерации недоступен.');
    const db = read(),
      draft = db.drafts.find((d) => d.id === params.id),
      token = request.headers.get('Idempotency-Key');
    if (!draft || !token) return fail('Черновик не найден.', 404);
    if (db.keys[token] === draft.id) return ok(draft, 202);
    const body = (await request.json()) as { version: number };
    const job = db.jobs.find((j) => j.id === draft.jobId);
    if (
      draft.version !== body.version ||
      !job ||
      !['failed', 'partial'].includes(project(job, draft).status)
    )
      return fail('Повтор сейчас недоступен. Обновите статус.');
    return start(db, draft, token);
  }),
  http.get(`${env.apiBaseUrl}/__preview/jobs/:id`, ({ params }) => {
    if (!mockAuthenticated()) return mockUnauthorized();
    const db = read(),
      job = db.jobs.find((j) => j.id === params.id),
      draft = db.drafts.find((d) => d.id === job?.draftId);
    return job && draft ? ok(project(job, draft)) : fail('Задание не найдено.', 404);
  }),
];
