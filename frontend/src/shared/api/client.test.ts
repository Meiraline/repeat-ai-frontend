import { describe, expect, it, vi } from 'vitest';
import { createApiClient } from './client';

describe('HTTP contract', () => {
  it('unwraps data and sends session cookies without retrying a mutation', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ data: { id: '1' } }));
    const request = createApiClient({ baseUrl: '/api/v1', fetchImpl });
    await expect(
      request('/courses', { method: 'POST', json: { title: 'Course' } }),
    ).resolves.toEqual({ id: '1' });
    expect(fetchImpl).toHaveBeenCalledExactlyOnceWith(
      '/api/v1/courses',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: '{"title":"Course"}',
      }),
    );
  });
  it.each([false, true])('normalizes error envelope (nested=%s)', async (nested) => {
    const envelope = {
      error: {
        code: 'INVALID',
        message: 'Check fields',
        retryable: false,
        fieldErrors: [{ field: 'email', code: 'INVALID', message: 'Invalid email' }],
      },
      meta: { requestId: 'req-1' },
    };
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json(nested ? { detail: envelope } : envelope, { status: 422 }));
    await expect(createApiClient({ baseUrl: '/api/v1', fetchImpl })('/auth')).rejects.toMatchObject(
      { status: 422, code: 'INVALID', requestId: 'req-1', fieldErrors: envelope.error.fieldErrors },
    );
  });
  it('accepts an empty 204 response', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
    await expect(
      createApiClient({ baseUrl: '/api/v1', fetchImpl })('/logout', { method: 'POST' }),
    ).resolves.toBeUndefined();
  });
  it('rejects a successful HTML fallback as an invalid API response', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response('<html>SPA</html>'));
    await expect(
      createApiClient({ baseUrl: '/api/v1', fetchImpl })('/dashboard'),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });
  it('does not retry a network failure on POST', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(
      createApiClient({ baseUrl: '/api/v1', fetchImpl })('/generate', { method: 'POST' }),
    ).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it('distinguishes cancellation from timeout', async () => {
    const fetchImpl: typeof fetch = (_url, options) =>
      new Promise((_resolve, reject) => {
        options?.signal?.addEventListener('abort', () => reject(options.signal?.reason), {
          once: true,
        });
      });
    const controller = new AbortController();
    const pending = createApiClient({ baseUrl: '/api', fetchImpl })('/dashboard', {
      signal: controller.signal,
    });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await expect(
      createApiClient({ baseUrl: '/api', fetchImpl, timeoutMs: 5 })('/dashboard'),
    ).rejects.toMatchObject({ code: 'TIMEOUT', retryable: true });
  });
});
