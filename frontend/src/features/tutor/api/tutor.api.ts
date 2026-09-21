import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { ApiError } from '@/shared/api/errors';
import { env } from '@/shared/config/env';
import { parseResponse } from '@/shared/api/parse-response';
import { tutorSchema, tutorThreadSchema, type TutorData } from '../model/tutor.schema';
function path(id: string) {
  if (!env.enableMocks)
    throw new ApiError('AI-репетитор пока не подключён.', 503, 'TUTOR_UNAVAILABLE');
  return `/__preview/tracks/${encodeURIComponent(id)}/tutor`;
}
export const tutorKey = (id: string, version: number) => ['session', 'tutor', id, version] as const;
export function useTutor(id: string, version: number) {
  return useQuery<TutorData>({
    queryKey: tutorKey(id, version),
    placeholderData: (previous) => previous,
    queryFn: async ({ signal }) => parseResponse(tutorSchema, await api(path(id), { signal })),
    retry: false,
  });
}
export async function createTutorThread(
  id: string,
  topicId: string | null,
  contextVersion: number,
  key: string,
) {
  return parseResponse(
    tutorThreadSchema,
    await api(`${path(id)}/threads`, {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      json: { topicId, contextVersion },
    }),
  );
}
export async function sendTutorMessage(
  id: string,
  threadId: string,
  text: string,
  contextVersion: number,
  clientMessageId: string,
) {
  return parseResponse(
    tutorThreadSchema,
    await api(`${path(id)}/threads/${encodeURIComponent(threadId)}/messages`, {
      method: 'POST',
      headers: { 'Idempotency-Key': clientMessageId },
      json: { text, contextVersion, clientMessageId },
    }),
  );
}
export async function refreshTutorContext(
  id: string,
  threadId: string,
  expectedVersion: number,
  contextVersion: number,
) {
  return parseResponse(
    tutorThreadSchema,
    await api(`${path(id)}/threads/${encodeURIComponent(threadId)}/context`, {
      method: 'PUT',
      json: { expectedVersion, contextVersion },
    }),
  );
}
