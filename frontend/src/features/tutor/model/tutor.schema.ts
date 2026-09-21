import { z } from 'zod';
import { contentBlockSchema } from '@/shared/lib/content';
export const tutorMessageSchema = z.object({
  id: z.string(),
  clientMessageId: z.string(),
  role: z.enum(['user', 'assistant']),
  blocks: z.array(contentBlockSchema),
  status: z.enum(['complete', 'partial']),
  contextVersion: z.number().int().positive(),
  sources: z.array(z.object({ title: z.string(), url: z.string() })),
});
export const tutorThreadSchema = z.object({
  id: z.string(),
  title: z.string(),
  topicId: z.string().nullable(),
  contextVersion: z.number().int().positive(),
  messages: z.array(tutorMessageSchema),
});
export const tutorSchema = z.object({
  trackId: z.string(),
  title: z.string(),
  contextVersion: z.number().int().positive(),
  topics: z.array(z.object({ id: z.string(), title: z.string() })),
  threads: z.array(tutorThreadSchema),
});
export const tutorSendSchema = z.object({
  text: z.string().trim().min(1).max(8000),
  contextVersion: z.number().int().positive(),
  clientMessageId: z.string().uuid(),
});
export type TutorData = z.infer<typeof tutorSchema>;
export type TutorThread = z.infer<typeof tutorThreadSchema>;
export type TutorMessage = z.infer<typeof tutorMessageSchema>;
