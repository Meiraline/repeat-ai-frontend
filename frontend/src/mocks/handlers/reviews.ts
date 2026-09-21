import { http, HttpResponse, delay } from 'msw';
import { env } from '@/shared/config/env';
import { reviewActionSchema, sourceGaps, type Review } from '@/features/plans';
import { mockAuthenticated, mockUnauthorized } from './auth';
import { readyPlan } from './plans';
import {
  readReviews as read,
  writeReviews as write,
  type ReviewDatabase as Database,
} from '../fixtures/review-store';
const ok = (data: unknown) => HttpResponse.json({ data });
const fail = (message: string, status = 409) =>
  HttpResponse.json(
    {
      error: {
        code: status === 409 ? 'VERSION_CONFLICT' : 'REVIEW_ERROR',
        message,
        retryable: status === 503,
      },
    },
    { status },
  );
function initialize(db: Database, id: string) {
  if (db.reviews[id]?.track) return db.reviews[id];
  const seed = readyPlan(id);
  if (!seed) return null;
  if (db.reviews[id]?.jobId === seed.job.id) return db.reviews[id];
  const { draft, job } = seed;
  const review: Review = {
    id,
    jobId: job.id,
    version: (db.reviews[id]?.version ?? 0) + 1,
    proposal: null,
    track: null,
    program: {
      title: draft.brief.skill,
      goal: draft.brief.targetOutcome,
      targetDate: draft.brief.targetDate,
      hoursPerWeek: Number(draft.brief.hoursPerWeek),
      formats: draft.brief.preferredFormats,
      constraints: draft.brief.constraints,
      topics: job.topics.map((t) => ({ ...t, sources: [] })),
    },
  };
  db.reviews[id] = review;
  write(db);
  return review;
}
export const reviewHandlers = [
  http.get(`${env.apiBaseUrl}/__preview/plan-reviews/:id`, ({ params }) => {
    if (!mockAuthenticated()) return mockUnauthorized();
    const review = initialize(read(), String(params.id));
    return review
      ? ok(review)
      : fail('Программа ещё не готова. Вернитесь к статусу генерации.', 404);
  }),
  http.post(`${env.apiBaseUrl}/__preview/plan-reviews/:id`, async ({ params, request }) => {
    if (!mockAuthenticated()) return mockUnauthorized();
    const identity = sessionStorage.getItem('repeat-preview-identity');
    await delay(300);
    if (!mockAuthenticated() || identity !== sessionStorage.getItem('repeat-preview-identity'))
      return mockUnauthorized();
    const parsed = reviewActionSchema.safeParse(await request.json());
    if (!parsed.success) return fail('Проверьте параметры запроса.', 422);
    const action = parsed.data,
      token = request.headers.get('Idempotency-Key'),
      db = read(),
      id = String(params.id);
    if (!token) return fail('Нужен ключ операции.', 400);
    const fingerprint = JSON.stringify([id, action]),
      saved = db.operations[token];
    if (saved)
      return saved.fingerprint === fingerprint
        ? ok(saved.response)
        : fail('Ключ уже использован для другого запроса.');
    const review = initialize(db, id);
    if (!review) return fail('Программа не найдена.', 404);
    if (review.version !== action.expectedPlanVersion)
      return fail(
        'Версия программы изменилась. Загрузите актуальную версию и проверьте изменения заново.',
      );
    if (review.track) return fail('Эта программа уже утверждена. Обновите страницу.');
    if (action.action === 'propose') {
      if (review.proposal) return fail('Сначала примените или отклоните сохранённое предложение.');
      const program = structuredClone(review.program);
      // Deterministic preview transformations; never presented as real AI research.
      if (action.kind === 'practice')
        program.topics.push({
          id: crypto.randomUUID(),
          title: 'Дополнительная практика',
          description: action.text,
          sources: [],
        });
      if (action.kind === 'workload') {
        program.hoursPerWeek = Math.max(0.5, Math.round(program.hoursPerWeek * 0.75 * 2) / 2);
        const date = new Date(`${program.targetDate}T12:00:00Z`);
        date.setUTCDate(date.getUTCDate() + 7);
        program.targetDate = date.toISOString().slice(0, 10);
      }
      if (action.kind === 'format') program.formats = 'Статьи и практика';
      if (action.kind === 'note') program.constraints += `\nПожелание: ${action.text}`;
      review.proposal = {
        id: crypto.randomUUID(),
        baseVersion: review.version,
        request: action.text,
        program,
      };
    } else if (action.action === 'apply' || action.action === 'reject') {
      if (
        !review.proposal ||
        review.proposal.id !== action.proposalId ||
        (action.action === 'apply' && review.proposal.baseVersion !== review.version)
      )
        return fail('Предложение устарело. Загрузите актуальную версию.');
      if (action.action === 'apply') {
        review.program = review.proposal.program;
        review.version++;
      }
      review.proposal = null;
    } else {
      if (review.proposal)
        return fail('Перед утверждением примените или отклоните предложение.', 422);
      if (sourceGaps(review.program).length && !action.acknowledgements.gaps)
        return fail('Подтвердите пробелы в источниках.', 422);
      review.track = {
        id: crypto.randomUUID(),
        title: review.program.title,
        status: 'active',
        progressPercent: 0,
      };
    }
    db.operations[token] = { fingerprint, response: structuredClone(review) };
    write(db);
    if (sessionStorage.getItem('repeat-preview-review-response') === action.action) {
      sessionStorage.removeItem('repeat-preview-review-response');
      return fail(
        'Ответ потерян после сохранения. Повторите действие — результат не продублируется.',
        503,
      );
    }
    return ok(review);
  }),
];
