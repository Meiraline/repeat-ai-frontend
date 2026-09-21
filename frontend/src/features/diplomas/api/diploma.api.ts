import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { ApiError } from '@/shared/api/errors';
import { env } from '@/shared/config/env';
import { parseResponse } from '@/shared/api/parse-response';
import { diplomaSchema } from '../model/diploma.schema';
function path(id: string) {
  if (!env.enableMocks)
    throw new ApiError('Выпуск дипломов пока не подключён.', 503, 'DIPLOMA_UNAVAILABLE');
  return `/__preview/tracks/${encodeURIComponent(id)}/diploma`;
}
export const diplomaKey = (id: string) => ['session', 'diploma', id] as const;
export function useDiploma(id: string) {
  return useQuery({
    queryKey: diplomaKey(id),
    queryFn: async ({ signal }) => parseResponse(diplomaSchema, await api(path(id), { signal })),
    retry: false,
    refetchInterval: (query) => (query.state.data?.status === 'generating' ? 1000 : false),
  });
}
export async function requestDiploma(id: string, name: string, key: string) {
  return parseResponse(
    diplomaSchema,
    await api(path(id), { method: 'POST', json: { name }, headers: { 'Idempotency-Key': key } }),
  );
}
