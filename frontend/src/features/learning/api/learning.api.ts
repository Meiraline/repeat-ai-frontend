import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { ApiError } from '@/shared/api/errors';
import { parseResponse } from '@/shared/api/parse-response';
import { env } from '@/shared/config/env';
import { learningTrackSchema, lessonSchema } from '../model/learning.schema';
function path(id: string) {
  if (!env.enableMocks)
    throw new ApiError('Сервис обучения пока не подключён.', 503, 'LEARNING_UNAVAILABLE');
  return `/__preview/tracks/${encodeURIComponent(id)}`;
}
export const trackKey = (id: string) => ['session', 'learning', id] as const;
export const lessonKey = (id: string, topic: string) =>
  ['session', 'learning', id, 'topic', topic] as const;
export function useLearningTrack(id: string) {
  return useQuery({
    queryKey: trackKey(id),
    queryFn: async ({ signal }) =>
      parseResponse(learningTrackSchema, await api(path(id), { signal })),
    retry: false,
  });
}
export function useLesson(id: string, topic: string) {
  return useQuery({
    queryKey: lessonKey(id, topic),
    queryFn: async ({ signal }) =>
      parseResponse(
        lessonSchema,
        await api(`${path(id)}/topics/${encodeURIComponent(topic)}`, { signal }),
      ),
    enabled: !!topic,
    retry: false,
  });
}
export async function completeMaterial(
  id: string,
  topic: string,
  material: string,
  completed: boolean,
  version: number,
  key: string,
) {
  return parseResponse(
    lessonSchema,
    await api(
      `${path(id)}/topics/${encodeURIComponent(topic)}/materials/${encodeURIComponent(material)}`,
      {
        method: 'PUT',
        headers: { 'Idempotency-Key': key },
        json: { completed, expectedVersion: version },
      },
    ),
  );
}
