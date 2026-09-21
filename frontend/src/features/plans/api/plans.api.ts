import { z } from 'zod';
import { api } from '@/shared/api/client';
import { ApiError } from '@/shared/api/errors';
import { parseResponse } from '@/shared/api/parse-response';
import { env } from '@/shared/config/env';
import { draftSchema, jobSchema, type PlanDraft } from '../model/plan.schema';

// Proposed asynchronous contract. Actual backend lacks job polling and draft listing.
function preview() {
  if (!env.enableMocks)
    throw new ApiError(
      'Создание плана пока недоступно. Подключение сервиса готовится.',
      503,
      'PLANS_UNAVAILABLE',
    );
}
export async function listDrafts(signal?: AbortSignal) {
  preview();
  return parseResponse(z.array(draftSchema), await api('/__preview/plans', { signal }));
}
export async function createDraft(key: string) {
  preview();
  return parseResponse(
    draftSchema,
    await api('/__preview/plans', { method: 'POST', headers: { 'Idempotency-Key': key } }),
  );
}
export async function getDraft(id: string, signal?: AbortSignal) {
  preview();
  return parseResponse(
    draftSchema,
    await api(`/__preview/plans/${encodeURIComponent(id)}`, { signal }),
  );
}
export async function saveDraft(draft: PlanDraft) {
  preview();
  return parseResponse(
    draftSchema,
    await api(`/__preview/plans/${encodeURIComponent(draft.id)}`, {
      method: 'PUT',
      headers: { 'If-Match': String(draft.version) },
      json: draft,
    }),
  );
}
export async function generatePlan(draft: PlanDraft) {
  preview();
  return parseResponse(
    draftSchema,
    await api(`/__preview/plans/${encodeURIComponent(draft.id)}/jobs`, {
      method: 'POST',
      headers: { 'Idempotency-Key': draft.generationKey },
      json: { version: draft.version },
    }),
  );
}
export async function getJob(id: string, signal?: AbortSignal) {
  preview();
  return parseResponse(
    jobSchema,
    await api(`/__preview/jobs/${encodeURIComponent(id)}`, { signal }),
  );
}
export async function retryJob(draft: PlanDraft, key: string) {
  preview();
  return parseResponse(
    draftSchema,
    await api(`/__preview/plans/${encodeURIComponent(draft.id)}/retry`, {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      json: { version: draft.version },
    }),
  );
}
