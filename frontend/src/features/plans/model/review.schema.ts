import { z } from 'zod';

export const programSchema = z.object({
  title: z.string(),
  goal: z.string(),
  targetDate: z.string(),
  hoursPerWeek: z.number().positive(),
  formats: z.string(),
  constraints: z.string(),
  topics: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      sources: z.array(
        z.object({
          title: z.string(),
          url: z.url().refine((v) => /^https?:\/\//.test(v)),
          verified: z.boolean(),
        }),
      ),
    }),
  ),
});
export const proposalSchema = z.object({
  id: z.string(),
  baseVersion: z.number().int().positive(),
  request: z.string(),
  program: programSchema,
});
export const reviewSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  version: z.number().int().positive(),
  program: programSchema,
  proposal: proposalSchema.nullable(),
  track: z
    .object({
      id: z.string(),
      title: z.string(),
      status: z.literal('active'),
      progressPercent: z.literal(0),
    })
    .nullable(),
});
export type Program = z.infer<typeof programSchema>;
export type Review = z.infer<typeof reviewSchema>;
export const reviewActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('propose'),
    expectedPlanVersion: z.number().int(),
    text: z.string().trim().min(1).max(5000),
    kind: z.enum(['practice', 'workload', 'format', 'note']),
  }),
  z.object({
    action: z.literal('apply'),
    expectedPlanVersion: z.number().int(),
    proposalId: z.string(),
  }),
  z.object({
    action: z.literal('reject'),
    expectedPlanVersion: z.number().int(),
    proposalId: z.string(),
  }),
  z.object({
    action: z.literal('approve'),
    expectedPlanVersion: z.number().int(),
    timezone: z.string().min(1),
    acknowledgements: z.object({ parameters: z.literal(true), gaps: z.boolean() }),
  }),
]);
export type ReviewAction = z.infer<typeof reviewActionSchema>;
export function sourceGaps(program: Program) {
  return program.topics.filter((t) => !t.sources.some((s) => s.verified));
}
export function programDiff(before: Program, after: Program) {
  const rows: { title: string; before: string; after: string }[] = [];
  const labels = {
    title: 'Название',
    goal: 'Цель',
    targetDate: 'Срок',
    hoursPerWeek: 'Часов в неделю',
    formats: 'Форматы',
    constraints: 'Ограничения и пожелания',
  } as const;
  for (const field of Object.keys(labels) as (keyof typeof labels)[]) {
    if (before[field] !== after[field])
      rows.push({
        title: labels[field],
        before: String(before[field]),
        after: String(after[field]),
      });
  }
  const ids = new Set([...before.topics, ...after.topics].map((t) => t.id));
  const retainedBefore = before.topics.filter((t) => after.topics.some((a) => a.id === t.id));
  const retainedAfter = after.topics.filter((t) => before.topics.some((b) => b.id === t.id));
  if (retainedBefore.some((t, i) => t.id !== retainedAfter[i]?.id))
    rows.push({
      title: 'Порядок тем',
      before: before.topics.map((t) => t.title).join(' → '),
      after: after.topics.map((t) => t.title).join(' → '),
    });
  for (const id of ids) {
    const b = before.topics.find((t) => t.id === id),
      a = after.topics.find((t) => t.id === id);
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      const describe = (t: typeof a) =>
        t
          ? `${t.title}. ${t.description}. Источники: ${t.sources.map((s) => `${s.title} (${s.url}, ${s.verified ? 'проверен' : 'не проверен'})`).join('; ') || 'нет'}`
          : 'Нет темы';
      rows.push({ title: a?.title ?? b!.title, before: describe(b), after: describe(a) });
    }
  }
  return rows;
}
