import { z } from 'zod';

export const briefSchema = z.object({
  skill: z.string().max(200),
  targetOutcome: z.string().max(2000),
  currentLevel: z.string().max(500),
  targetDate: z.string().max(10),
  hoursPerWeek: z.string().max(6),
  preferredFormats: z.string().max(500),
  constraints: z.string().max(2000),
});
export type Brief = z.infer<typeof briefSchema>;
export const fields = [
  'skill',
  'targetOutcome',
  'currentLevel',
  'targetDate',
  'hoursPerWeek',
  'preferredFormats',
  'constraints',
] as const;
export type BriefField = (typeof fields)[number];
export const emptyBrief: Brief = {
  skill: '',
  targetOutcome: '',
  currentLevel: '',
  targetDate: '',
  hoursPerWeek: '',
  preferredFormats: '',
  constraints: '',
};
export function validateAnswer(field: BriefField, value: string): string | undefined {
  if (!value.trim()) return 'Заполните ответ. Если ограничений нет, напишите «Нет».';
  if (
    value.length >
    (field === 'targetOutcome' || field === 'constraints' ? 2000 : field === 'skill' ? 200 : 500)
  )
    return 'Ответ слишком длинный.';
  if (
    field === 'hoursPerWeek' &&
    (!Number.isFinite(Number(value)) || Number(value) <= 0 || Number(value) > 80)
  )
    return 'Укажите от 0,5 до 80 часов в неделю.';
  if (field === 'hoursPerWeek' && Number(value) < 0.5)
    return 'Укажите от 0,5 до 80 часов в неделю.';
  if (field === 'targetDate') {
    const date = new Date(`${value}T12:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date < today)
      return 'Укажите сегодняшнюю или будущую дату.';
  }
}
export const draftSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  brief: briefSchema,
  step: z.number().int().min(0).max(7),
  phase: z.enum(['interview', 'risk', 'summary', 'generation']),
  acceptedRisk: z.boolean(),
  risk: z.enum(['high', 'normal']).nullable(),
  generationKey: z.string(),
  jobId: z.string().nullable(),
});
export type PlanDraft = z.infer<typeof draftSchema>;
export const jobSchema = z.object({
  id: z.string(),
  draftId: z.string(),
  status: z.enum(['queued', 'running', 'succeeded', 'partial', 'failed']),
  stage: z.number().int().min(0).max(5),
  progress: z.number().min(0).max(100),
  delayed: z.boolean(),
  message: z.string(),
  topics: z.array(z.object({ id: z.string(), title: z.string(), description: z.string() })),
});
export type PlanJob = z.infer<typeof jobSchema>;
export function isJobPending(status?: PlanJob['status']) {
  return status === 'queued' || status === 'running';
}
