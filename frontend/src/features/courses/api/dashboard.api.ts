import { z } from 'zod';
import { api } from '@/shared/api/client';
import { ApiError } from '@/shared/api/errors';

// A deliberately small projection of DashboardService; extra server fields are ignored.
const dashboardSchema = z.object({
  summary: z.object({
    activeTrackCount: z.number().int().nonnegative(),
    attentionCount: z.number().int().nonnegative(),
    nextDeadline: z.string().nullable(),
  }),
  tracks: z.array(
    z.object({
      id: z.string(),
      planId: z.string().optional(),
      title: z.string(),
      status: z.string(),
      progressPercent: z.number().min(0).max(100),
      currentTopic: z.object({ id: z.string(), title: z.string() }).nullable().optional(),
      nextAction: z.string().nullable().optional(),
      nextDeadline: z.string().nullable().optional(),
      riskStatus: z.string().nullable().optional(),
    }),
  ),
  partialErrors: z.array(z.unknown()),
});

export type Dashboard = z.infer<typeof dashboardSchema>;

export async function getDashboard(
  filter: 'active' | 'attention' | 'completed' = 'active',
  signal?: AbortSignal,
): Promise<Dashboard> {
  const result = dashboardSchema.safeParse(await api(`/dashboard?filter=${filter}`, { signal }));
  if (!result.success) {
    throw new ApiError('Не удалось прочитать данные обучения.', 200, 'INVALID_RESPONSE');
  }
  return result.data;
}
