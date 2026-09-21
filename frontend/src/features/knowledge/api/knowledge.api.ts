import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { ApiError } from '@/shared/api/errors';
import { env } from '@/shared/config/env';
import { parseResponse } from '@/shared/api/parse-response';
import { knowledgeSchema, knowledgeEntrySchema } from '../model/knowledge.schema';
function path(id: string) {
  if (!env.enableMocks)
    throw new ApiError('База знаний пока не подключена.', 503, 'KNOWLEDGE_UNAVAILABLE');
  return `/__preview/tracks/${encodeURIComponent(id)}/knowledge`;
}
export const knowledgeKey = (id: string) => ['session', 'knowledge', id] as const;
export function useKnowledge(id: string) {
  return useQuery({
    queryKey: knowledgeKey(id),
    queryFn: async ({ signal }) => parseResponse(knowledgeSchema, await api(path(id), { signal })),
    retry: false,
  });
}
export async function rateKnowledge(
  id: string,
  entry: string,
  rating: 'repeat' | 'known',
  version: number,
  key: string,
) {
  return parseResponse(
    knowledgeEntrySchema,
    await api(`${path(id)}/${encodeURIComponent(entry)}`, {
      method: 'PUT',
      headers: { 'Idempotency-Key': key },
      json: { rating, expectedVersion: version },
    }),
  );
}
