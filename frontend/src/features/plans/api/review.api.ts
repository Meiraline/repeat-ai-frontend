import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { ApiError } from '@/shared/api/errors';
import { parseResponse } from '@/shared/api/parse-response';
import { env } from '@/shared/config/env';
import { reviewSchema, type ReviewAction } from '../model/review.schema';
export const reviewKey = (id: string) => ['session', 'plan-review', id] as const;
function path(id: string) {
  if (!env.enableMocks)
    throw new ApiError(
      'Согласование программы пока недоступно. Подключение сервиса готовится.',
      503,
      'REVIEW_UNAVAILABLE',
    );
  return `/__preview/plan-reviews/${encodeURIComponent(id)}`;
}
export async function getReview(id: string, signal?: AbortSignal) {
  return parseResponse(reviewSchema, await api(path(id), { signal }));
}
export function useReview(id: string) {
  return useQuery({
    queryKey: reviewKey(id),
    queryFn: ({ signal }) => getReview(id, signal),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
}
export async function changeReview(id: string, action: ReviewAction, key: string) {
  return parseResponse(
    reviewSchema,
    await api(path(id), { method: 'POST', headers: { 'Idempotency-Key': key }, json: action }),
  );
}
