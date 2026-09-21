import { afterEach, expect, it, vi } from 'vitest';
import {
  getProfile,
  login,
  logout,
  clearAuthMemory,
  hasCsrfContext,
  saveProfile,
} from './auth.api';
afterEach(() => {
  vi.restoreAllMocks();
  clearAuthMemory();
});
it('distinguishes current logout from all sessions and does not claim global success on 401', async () => {
  const fetch = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(null, { status: 204 }));
  await logout();
  expect(JSON.parse(fetch.mock.calls[0]?.[1]?.body as string)).toEqual({ allSessions: false });
  await logout(true);
  expect(JSON.parse(fetch.mock.calls[1]?.[1]?.body as string)).toEqual({ allSessions: true });
  fetch.mockResolvedValue(
    new Response(JSON.stringify({ error: { message: 'Expired' } }), { status: 401 }),
  );
  await expect(logout(true)).rejects.toMatchObject({ status: 401 });
  fetch.mockResolvedValueOnce(
    new Response(JSON.stringify({ error: { message: 'Expired' } }), { status: 401 }),
  );
  await expect(logout()).resolves.toBeUndefined();
});
function respond(payload: unknown, status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}
it('sends the edited profile with its original version and excludes read-only fields', async () => {
  const profile = {
    displayName: 'Anna',
    certificateName: null,
    timezone: 'UTC',
    language: 'ru',
    preferredFormats: [],
    weeklyReminderEnabled: false,
    version: 4,
  };
  const fetch = respond({ data: { ...profile, version: 5 } });
  expect((await saveProfile(profile, 4)).version).toBe(5);
  const options = fetch.mock.calls[0]?.[1];
  expect(new Headers(options?.headers).get('If-Match')).toBe('4');
  expect(JSON.parse(options?.body as string)).not.toHaveProperty('version');
  expect(JSON.parse(options?.body as string)).not.toHaveProperty('language');
  fetch.mockResolvedValueOnce(
    new Response(JSON.stringify({ error: { code: 'VERSION_CONFLICT', message: 'Changed' } }), {
      status: 409,
    }),
  );
  await expect(saveProfile(profile, 4)).rejects.toMatchObject({ status: 409 });
  expect(fetch).toHaveBeenCalledTimes(2);
});
it('treats 401 as anonymous but preserves a service error', async () => {
  const fetch = respond({ error: { code: 'SESSION_EXPIRED', message: 'Expired' } }, 401);
  expect(await getProfile()).toBeNull();
  fetch.mockResolvedValueOnce(
    new Response(JSON.stringify({ error: { code: 'UNAVAILABLE', message: 'Unavailable' } }), {
      status: 503,
    }),
  );
  await expect(getProfile()).rejects.toMatchObject({ status: 503 });
});
it('normalizes a malformed success response without exposing schema internals', async () => {
  respond({ data: { user: { id: 123 } } });
  await expect(
    login({ email: 'test@example.test', password: 'Example123', returnPath: '/app' }),
  ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  expect(hasCsrfContext()).toBe(false);
});
it('clears in-memory auth context only after logout succeeds', async () => {
  const fetch = respond({
    data: {
      user: { id: 'test', email: 'test@example.test', authStatus: 'active' },
      profile: { displayName: 'Test', timezone: 'UTC', language: 'ru' },
      csrfToken: 'test-only',
    },
  });
  await login({ email: 'test@example.test', password: 'Example123', returnPath: '/app' });
  expect(hasCsrfContext()).toBe(true);
  fetch.mockResolvedValueOnce(
    new Response(JSON.stringify({ error: { message: 'Unavailable' } }), { status: 503 }),
  );
  await expect(logout()).rejects.toMatchObject({ status: 503 });
  expect(hasCsrfContext()).toBe(true);
  fetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
  await logout();
  expect(hasCsrfContext()).toBe(false);
});
