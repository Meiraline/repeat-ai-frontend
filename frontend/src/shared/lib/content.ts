import { z } from 'zod';
export function safeSourceUrl(value: string) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export const contentBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), text: z.string() }),
  z.object({ type: z.literal('heading'), text: z.string() }),
  z.object({ type: z.literal('list'), items: z.array(z.string()) }),
  z.object({ type: z.literal('code'), text: z.string(), language: z.string() }),
  z.object({
    type: z.literal('table'),
    headers: z.array(z.string()),
    rows: z.array(z.array(z.string())),
  }),
  z.object({ type: z.literal('link'), title: z.string(), url: z.string() }),
]);
export type ContentBlock = z.infer<typeof contentBlockSchema>;
