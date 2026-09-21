import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { env } from '@/shared/config/env';
import { diplomaNameSchema } from '@/features/diplomas';
import sample from '@/assets/screens/diploma-sample.png';
import { mockAuthenticated, mockUnauthorized } from './auth';
import { readAssessments, writeAssessments, settleAttempt } from '../fixtures/assessment-store';
import { findLearning } from '../fixtures/learning-store';
const base = `${env.apiBaseUrl}/__preview/tracks/:id/diploma`;
const fail = (message: string, status: number) =>
  HttpResponse.json({ error: { code: 'DIPLOMA_ERROR', message } }, { status });
function data(id: string) {
  const learning = findLearning(id)?.record;
  if (!learning) return null;
  const db = readAssessments(),
    track = db[id],
    attempt = track?.assessments['project:final']?.attempts.at(-1);
  if (attempt) settleAttempt(id, 'project', 'final', attempt);
  const eligible =
    learning.track.modules.flatMap((m) => m.topics).every((t) => t.status === 'passed') &&
    attempt?.status === 'passed' &&
    attempt.planVersion === learning.track.planVersion;
  const cert = track?.diploma;
  if (cert?.status === 'generating' && Date.now() - cert.requestedAt > 2500) cert.status = 'ready';
  writeAssessments(db);
  return {
    db,
    eligible,
    value: {
      trackId: id,
      title: learning.track.title,
      status: cert?.status ?? (eligible ? 'eligible' : 'locked'),
      reason: eligible || cert ? null : 'Пройдите все экзамены и итоговый проект.',
      certificate: cert
        ? {
            id: cert.id,
            name: cert.name,
            isSample: true as const,
            sampleUrl: cert.status === 'ready' ? sample : '',
          }
        : null,
    },
  };
}
export const diplomaHandlers = [
  http.get(base, ({ params }) => {
    if (!mockAuthenticated()) return mockUnauthorized();
    const result = data(String(params.id));
    return result ? HttpResponse.json({ data: result.value }) : fail('Курс не найден.', 404);
  }),
  http.post(base, async ({ params, request }) => {
    if (!mockAuthenticated()) return mockUnauthorized();
    const id = String(params.id),
      result = data(id),
      body = z.object({ name: diplomaNameSchema }).safeParse(await request.json()),
      key = request.headers.get('Idempotency-Key');
    if (!result) return fail('Курс не найден.', 404);
    if (!body.success || !key) return fail('Проверьте имя и повторите запрос.', 422);
    const existing = result.db[id]?.diploma;
    if (existing)
      return existing.name === body.data.name
        ? HttpResponse.json({ data: result.value })
        : fail('Имя уже зафиксировано в заявке. Существующий документ не изменён.', 409);
    if (!result.eligible) return fail('Выпуск пока недоступен.', 403);
    result.db[id]!.diploma = {
      id: crypto.randomUUID(),
      name: body.data.name,
      requestedAt: Date.now(),
      status: 'generating',
      key,
    };
    writeAssessments(result.db);
    if (sessionStorage.getItem('repeat-preview-diploma-response') === 'lost') {
      sessionStorage.removeItem('repeat-preview-diploma-response');
      return fail('Ответ потерян после создания заявки. Повторите запрос.', 503);
    }
    return HttpResponse.json({ data: data(id)!.value });
  }),
];
