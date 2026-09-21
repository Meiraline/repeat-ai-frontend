import { z } from 'zod';
import { api } from '@/shared/api/client';
import { ApiError } from '@/shared/api/errors';
import { env } from '@/shared/config/env';
import { parseResponse } from '@/shared/api/parse-response';
const stateSchema = z.object({
  step: z.number().int().min(0).max(9),
  complete: z.boolean(),
  values: z.record(z.string(), z.union([z.string(), z.array(z.string()), z.boolean()])),
});
export type OnboardingState = z.infer<typeof stateSchema>;
function requireContract() {
  if (!env.enableMocks)
    throw new ApiError(
      'Настройка первого запуска пока недоступна. Вы можете перейти в кабинет.',
      503,
      'ONBOARDING_UNAVAILABLE',
    );
}
export async function getOnboarding(signal?: AbortSignal) {
  requireContract();
  return parseResponse(stateSchema, await api('/__preview/onboarding', { signal }));
}
export async function saveOnboarding(state: OnboardingState) {
  requireContract();
  return parseResponse(
    stateSchema,
    await api('/__preview/onboarding', { method: 'PUT', json: state }),
  );
}
