import { expect, it, vi } from 'vitest';
vi.mock('@/shared/config/env', () => ({ env: { enableMocks: false, apiBaseUrl: '/api/v1' } }));
import { createCheckout, getBilling, setAutoRenew, simulatePayment } from './billing.api';
it('blocks every draft billing endpoint outside mock mode without sending requests', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch');
  try {
    for (const operation of [
      () => getBilling(),
      () => createCheckout('key'),
      () => setAutoRenew(false, 1),
      () => simulatePayment('id', 'succeeded'),
    ]) {
      await expect(operation()).rejects.toMatchObject({ status: 503, code: 'BILLING_UNAVAILABLE' });
    }
    expect(fetch).not.toHaveBeenCalled();
  } finally {
    fetch.mockRestore();
  }
});
