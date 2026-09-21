import { z } from 'zod';
import { contentBlockSchema } from '@/shared/lib/content';
export const topicStatusSchema = z.enum([
  'locked',
  'available',
  'in_progress',
  'ready_for_exam',
  'passed',
]);
export const topicSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  status: topicStatusSchema,
  progressPercent: z.number().min(0).max(100),
  lockReason: z.string().nullable(),
});
export const learningTrackSchema = z.object({
  id: z.string(),
  title: z.string(),
  planId: z.string(),
  planVersion: z.number().int(),
  version: z.number().int(),
  progressPercent: z.number().min(0).max(100),
  currentTopicId: z.string().nullable(),
  modules: z.array(
    z.object({ id: z.string(), title: z.string(), topics: z.array(topicSummarySchema) }),
  ),
});
export const materialSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string(),
  url: z.string().nullable(),
  verificationStatus: z.enum(['verified', 'unverified', 'broken']),
  completed: z.boolean(),
  required: z.boolean(),
  version: z.number().int(),
  blocks: z.array(contentBlockSchema),
});
export const lessonSchema = z.object({
  topic: topicSummarySchema.extend({ outcome: z.string() }),
  materials: z.array(materialSchema),
  examAccess: z.object({ allowed: z.boolean(), reason: z.string().nullable() }),
});
export type LearningTrack = z.infer<typeof learningTrackSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export const statusLabel = {
  locked: 'Заблокировано',
  available: 'Доступно',
  in_progress: 'В процессе',
  ready_for_exam: 'Готово к контрольной точке',
  passed: 'Пройдено',
} as const;
