import { z } from 'zod';
export const diplomaNameSchema = z
  .string()
  .trim()
  .min(2, 'Введите имя: от 2 символов.')
  .max(100, 'Не более 100 символов.')
  .regex(/^[\p{L}\p{M} '-]+$/u, 'Используйте буквы, пробел, дефис или апостроф.')
  .refine((value) => /\p{L}/u.test(value), 'Имя должно содержать буквы.');
export const diplomaSchema = z.object({
  trackId: z.string(),
  title: z.string(),
  status: z.enum(['locked', 'eligible', 'generating', 'ready']),
  reason: z.string().nullable(),
  certificate: z
    .object({ id: z.string(), name: z.string(), sampleUrl: z.string(), isSample: z.literal(true) })
    .nullable(),
});
export type Diploma = z.infer<typeof diplomaSchema>;
