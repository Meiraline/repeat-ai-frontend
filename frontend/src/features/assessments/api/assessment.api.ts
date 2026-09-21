import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { ApiError } from '@/shared/api/errors';
import { env } from '@/shared/config/env';
import { parseResponse } from '@/shared/api/parse-response';
import {
  assessmentSchema,
  attemptSchema,
  type AssessmentKind,
  type Answers,
  type Attempt,
} from '../model/assessment.schema';
function path(id: string, kind: AssessmentKind, target: string) {
  if (!env.enableMocks)
    throw new ApiError('Проверка знаний пока не подключена.', 503, 'ASSESSMENT_UNAVAILABLE');
  return `/__preview/tracks/${encodeURIComponent(id)}/assessments/${kind}/${encodeURIComponent(target)}`;
}
export const assessmentKey = (id: string, kind: AssessmentKind, target: string) =>
  ['session', 'assessment', id, kind, target] as const;
export function useAssessment(id: string, kind: AssessmentKind, target: string) {
  return useQuery({
    queryKey: assessmentKey(id, kind, target),
    queryFn: async ({ signal }) =>
      parseResponse(assessmentSchema, await api(path(id, kind, target), { signal })),
    retry: false,
    refetchInterval: (query) =>
      ['submitted', 'evaluating'].includes(query.state.data?.attempt?.status ?? '') ? 1000 : false,
  });
}
export type AssessmentAction =
  | { action: 'start' }
  | {
      action: 'save';
      attemptId: string;
      expectedVersion: number;
      answers: Answers;
      project: Attempt['project'];
    }
  | { action: 'submit'; attemptId: string; expectedVersion: number; allowUnanswered: boolean };
export async function actAssessment(
  id: string,
  kind: AssessmentKind,
  target: string,
  body: AssessmentAction,
  key: string,
) {
  return parseResponse(
    attemptSchema,
    await api(path(id, kind, target), {
      method: 'POST',
      json: body,
      headers: { 'Idempotency-Key': key },
    }),
  );
}
