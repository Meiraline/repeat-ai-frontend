import { z } from 'zod';
import { contentBlockSchema } from '@/shared/lib/content';
export const knowledgeEntrySchema = z.object({
  id: z.string(),
  topicId: z.string(),
  topicTitle: z.string(),
  kind: z.enum(['question', 'term', 'source']),
  title: z.string(),
  blocks: z.array(contentBlockSchema),
  url: z.string().nullable(),
  verificationStatus: z.enum(['verified', 'unverified', 'broken']),
  rating: z.enum(['unseen', 'repeat', 'known']),
  version: z.number().int(),
});
export const knowledgeSchema = z.object({
  trackId: z.string(),
  title: z.string(),
  planVersion: z.number().int(),
  entries: z.array(knowledgeEntrySchema),
});
export type KnowledgeEntry = z.infer<typeof knowledgeEntrySchema>;
export type Knowledge = z.infer<typeof knowledgeSchema>;
