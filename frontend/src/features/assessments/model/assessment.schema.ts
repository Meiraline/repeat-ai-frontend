import { z } from 'zod';
import { safeSourceUrl } from '@/shared/lib/content';
export const answerSchema = z.union([z.string().max(12000), z.array(z.string()).max(20)]);
export const projectDraftSchema = z.object({
  description: z.string().max(12000),
  url: z
    .string()
    .max(2000)
    .refine(
      (v) => !v || !!safeSourceUrl(v),
      'Укажите полный HTTP/HTTPS адрес без логина и пароля.',
    ),
});
export const questionSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['single', 'multiple', 'short', 'free']),
  options: z.array(z.object({ id: z.string(), text: z.string() })),
});
export const attemptSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  planVersion: z.number().int().positive(),
  status: z.enum([
    'active',
    'submitted',
    'evaluating',
    'passed',
    'failed',
    'review_required',
    'expired',
  ]),
  questions: z.array(questionSchema),
  answers: z.record(z.string(), answerSchema),
  project: projectDraftSchema,
  dueAt: z.iso.datetime({ offset: true }).nullable(),
  feedback: z.array(z.string()),
});
export const assessmentSchema = z.object({
  title: z.string(),
  allowed: z.boolean(),
  reason: z.string().nullable(),
  requirements: z.array(z.string()),
  attempt: attemptSchema.nullable(),
  history: z.array(z.object({ id: z.string(), status: attemptSchema.shape.status })),
});
export type Attempt = z.infer<typeof attemptSchema>;
export type Assessment = z.infer<typeof assessmentSchema>;
export type Answers = Attempt['answers'];
export type AssessmentKind = 'exam' | 'project';
export const attemptStatusLabel = {
  active: 'В работе',
  submitted: 'Работа отправлена',
  evaluating: 'Идёт проверка',
  passed: 'Критерий выполнен',
  failed: 'Нужна доработка',
  review_required: 'Нужна дополнительная проверка',
  expired: 'Время истекло',
} as const;
export function isAnswered(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.length > 0 : !!value?.trim();
}
export function remainingSeconds(dueAt: string | null, now = Date.now()) {
  return dueAt ? Math.max(0, Math.ceil((Date.parse(dueAt) - now) / 1000)) : null;
}
