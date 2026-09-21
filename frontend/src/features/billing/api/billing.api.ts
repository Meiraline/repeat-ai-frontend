import { api } from '@/shared/api/client';
import { ApiError } from '@/shared/api/errors';
import { parseResponse } from '@/shared/api/parse-response';
import { env } from '@/shared/config/env';
import { billingSchema } from '../model/billing.schema';
function available() {
  if (!env.enableMocks)
    throw new ApiError(
      'Оплата пока не подключена. Информация о подписке будет доступна после запуска сервиса.',
      503,
      'BILLING_UNAVAILABLE',
    );
}
export async function getBilling(signal?: AbortSignal) {
  available();
  return parseResponse(billingSchema, await api('/__preview/billing', { signal }));
}
export async function createCheckout(key: string, signal?: AbortSignal) {
  available();
  return parseResponse(
    billingSchema,
    await api('/__preview/billing/checkout', {
      method: 'POST',
      json: { planId: 'pilot' },
      headers: { 'Idempotency-Key': key },
      signal,
    }),
  );
}
export async function setAutoRenew(enabled: boolean, version: number, signal?: AbortSignal) {
  available();
  return parseResponse(
    billingSchema,
    await api('/__preview/billing/subscription', {
      method: 'PUT',
      json: { autoRenew: enabled },
      headers: { 'If-Match': String(version) },
      signal,
    }),
  );
}
export async function simulatePayment(
  id: string,
  outcome: 'succeeded' | 'failed' | 'cancelled',
  signal?: AbortSignal,
) {
  available();
  return parseResponse(
    billingSchema,
    await api(`/__preview/billing/checkout/${encodeURIComponent(id)}/simulate`, {
      method: 'POST',
      json: { outcome },
      signal,
    }),
  );
}
