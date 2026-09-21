import { http, HttpResponse, delay } from 'msw';
import { env } from '@/shared/config/env';
import { demoAccount, demoProfile } from '../fixtures/auth';
import { profilePatchSchema } from '@/features/auth';

// Preview-only persistence. No production cookie/session logic is implemented here.
type Account = { email: string; displayName: string; digest: string; verified: boolean };
const storageKey = 'repeat-preview-account';
const sessionKey = 'repeat-preview-session';
const profileKey = 'repeat-preview-profile';
const onboardingKey = 'repeat-preview-onboarding';
export function mockAuthenticated() {
  return sessionStorage.getItem(sessionKey) === 'active';
}
const success = (data: unknown, status = 200) =>
  HttpResponse.json(
    { data, meta: { requestId: 'preview', timestamp: new Date().toISOString() } },
    { status },
  );
export const mockUnauthorized = () =>
  HttpResponse.json(
    {
      error: {
        code: 'SESSION_EXPIRED',
        message: 'Сессия завершена. Войдите снова.',
        retryable: false,
      },
    },
    { status: 401 },
  );
const failure = (message: string, status = 400, code = 'VALIDATION_ERROR') =>
  HttpResponse.json({ error: { code, message, retryable: false } }, { status });
const digest = async (password: string) =>
  Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))),
  )
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
const profile = () => JSON.parse(sessionStorage.getItem(profileKey) ?? JSON.stringify(demoProfile));
export const authHandlers = [
  http.get(`${env.apiBaseUrl}/me/profile`, async () => {
    await delay(100);
    return mockAuthenticated() ? success(profile()) : mockUnauthorized();
  }),
  http.post(`${env.apiBaseUrl}/login`, async ({ request }) => {
    await delay(250);
    const body = (await request.json()) as { email: string; password: string };
    const account = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null') as Account | null;
    const demo =
      account?.email !== demoAccount.email &&
      body.email === demoAccount.email &&
      body.password === demoAccount.password;
    const match = account?.email === body.email && account.digest === (await digest(body.password));
    if (!demo && !match) return failure('Неверный email или пароль.', 401, 'INVALID_CREDENTIALS');
    if (match && !account?.verified)
      return failure('Подтвердите email по ссылке из письма.', 403, 'EMAIL_NOT_VERIFIED');
    const next = {
      ...demoProfile,
      displayName: match ? account!.displayName : demoAccount.displayName,
    };
    const old = sessionStorage.getItem('repeat-preview-identity');
    if (old !== body.email) {
      sessionStorage.setItem(profileKey, JSON.stringify(next));
      sessionStorage.removeItem(onboardingKey);
    }
    sessionStorage.setItem('repeat-preview-identity', body.email);
    sessionStorage.setItem(sessionKey, 'active');
    return success({
      user: { id: 'preview-user', email: body.email, authStatus: 'active' },
      profile: profile(),
      csrfToken: 'preview-only',
    });
  }),
  http.post(`${env.apiBaseUrl}/register`, async ({ request }) => {
    await delay(250);
    const body = (await request.json()) as { displayName: string; email: string; password: string };
    const previous = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null') as Account | null;
    if (body.email === demoAccount.email || previous?.email === body.email)
      return failure('Аккаунт с этим email уже существует.', 409, 'EMAIL_TAKEN');
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        email: body.email,
        displayName: body.displayName,
        digest: await digest(body.password),
        verified: false,
      }),
    );
    sessionStorage.removeItem('repeat-preview-verify-used');
    return success(
      {
        user: { id: 'preview-new-user', email: body.email, authStatus: 'pending' },
        verification: { required: true, resendAfterSec: 60 },
      },
      201,
    );
  }),
  http.post(`${env.apiBaseUrl}/email/verifications`, async ({ request }) => {
    await delay(150);
    const { token } = (await request.json()) as { token: string };
    const account = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null') as Account | null;
    if (
      token !== 'preview-verify' ||
      !account ||
      sessionStorage.getItem('repeat-preview-verify-used')
    )
      return failure('Ссылка недействительна.', 410, 'TOKEN_EXPIRED');
    account.verified = true;
    sessionStorage.setItem(storageKey, JSON.stringify(account));
    sessionStorage.setItem('repeat-preview-verify-used', 'true');
    return success({
      user: { id: 'preview-new-user', email: account.email, authStatus: 'active' },
      profile: null,
    });
  }),
  http.post(`${env.apiBaseUrl}/password/restore-requests`, async ({ request }) => {
    await delay(150);
    const { email } = (await request.json()) as { email: string };
    sessionStorage.setItem('repeat-preview-reset-email', email);
    sessionStorage.removeItem('repeat-preview-reset-used');
    return success({ accepted: true, resendAfterSec: 60 }, 202);
  }),
  http.post(`${env.apiBaseUrl}/password/resets`, async ({ request }) => {
    await delay(150);
    const { token, newPassword } = (await request.json()) as { token: string; newPassword: string };
    if (token !== 'preview-reset' || sessionStorage.getItem('repeat-preview-reset-used'))
      return failure('Ссылка недействительна.', 410, 'TOKEN_EXPIRED');
    const account = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null') as Account | null;
    const target = sessionStorage.getItem('repeat-preview-reset-email');
    const updated =
      account?.email === target
        ? account
        : target === demoAccount.email
          ? {
              email: demoAccount.email,
              displayName: demoAccount.displayName,
              verified: true,
              digest: '',
            }
          : null;
    if (!updated) return failure('Ссылка недействительна.', 410, 'TOKEN_EXPIRED');
    updated.digest = await digest(newPassword);
    sessionStorage.setItem(storageKey, JSON.stringify(updated));
    sessionStorage.setItem('repeat-preview-reset-used', 'true');
    sessionStorage.removeItem(sessionKey);
    return success({ passwordChanged: true, loginRequired: true });
  }),
  http.post(`${env.apiBaseUrl}/logout`, async () => {
    await delay(100);
    sessionStorage.removeItem(sessionKey);
    return new HttpResponse(null, { status: 204 });
  }),
  http.patch(`${env.apiBaseUrl}/me/profile`, async ({ request }) => {
    if (sessionStorage.getItem('repeat-preview-profile-response') === 'expired') {
      sessionStorage.removeItem('repeat-preview-profile-response');
      sessionStorage.removeItem(sessionKey);
    }
    if (!mockAuthenticated()) return mockUnauthorized();
    const current = profile();
    if (request.headers.get('If-Match') !== String(current.version))
      return failure('Профиль изменился. Обновите страницу.', 409, 'VERSION_CONFLICT');
    const parsed = profilePatchSchema.partial().safeParse(await request.json());
    if (!parsed.success) return failure('Проверьте поля профиля.');
    const next = { ...current, ...parsed.data, version: current.version + 1 };
    sessionStorage.setItem(profileKey, JSON.stringify(next));
    if (sessionStorage.getItem('repeat-preview-profile-response') === 'lost') {
      sessionStorage.removeItem('repeat-preview-profile-response');
      return HttpResponse.error();
    }
    return success(next);
  }),
  // Proposed contract, isolated from actual backend paths. Never used outside mock mode.
  http.get(`${env.apiBaseUrl}/__preview/onboarding`, () =>
    mockAuthenticated()
      ? success(
          JSON.parse(
            sessionStorage.getItem(onboardingKey) ?? '{"step":0,"complete":false,"values":{}}',
          ),
        )
      : mockUnauthorized(),
  ),
  http.put(`${env.apiBaseUrl}/__preview/onboarding`, async ({ request }) => {
    if (!mockAuthenticated()) return mockUnauthorized();
    await delay(150);
    const body = (await request.json()) as { values: Record<string, unknown> };
    sessionStorage.setItem(onboardingKey, JSON.stringify(body));
    const current = profile();
    sessionStorage.setItem(
      profileKey,
      JSON.stringify({
        ...current,
        displayName: body.values.displayName ?? current.displayName,
        certificateName: body.values.certificateName ?? current.certificateName,
        version: current.version + 1,
      }),
    );
    return success(body);
  }),
];
