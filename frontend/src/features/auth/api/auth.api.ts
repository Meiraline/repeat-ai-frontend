import { z } from 'zod';
import { api } from '@/shared/api/client';
import { ApiError } from '@/shared/api/errors';
import { profileSchema, profilePatchSchema, type ProfilePatch } from '../model/auth.schema';
import { parseResponse } from '@/shared/api/parse-response';

const user = z.object({ id: z.string(), email: z.string(), authStatus: z.string() });
let csrfToken: string | undefined;
// Header name and recovery endpoint are still unconfirmed. Keep token only in memory;
// do not invent a security protocol. Cookie credentials are handled by the transport.
export function clearAuthMemory() {
  csrfToken = undefined;
}
export function hasCsrfContext() {
  return csrfToken !== undefined;
}
export async function getProfile(signal?: AbortSignal) {
  try {
    return parseResponse(profileSchema, await api('/me/profile', { signal }));
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}
export async function saveProfile(values: ProfilePatch, version: number, signal?: AbortSignal) {
  return parseResponse(
    profileSchema,
    await api('/me/profile', {
      method: 'PATCH',
      json: profilePatchSchema.parse(values),
      headers: { 'If-Match': String(version) },
      signal,
    }),
  );
}
export async function login(values: { email: string; password: string; returnPath: string }) {
  const result = parseResponse(
    z.object({
      user,
      profile: z.object({ displayName: z.string(), timezone: z.string(), language: z.string() }),
      csrfToken: z.string(),
    }),
    await api('/login', { method: 'POST', json: values }),
  );
  csrfToken = result.csrfToken;
  return result;
}
export async function register(values: {
  displayName: string;
  email: string;
  password: string;
  consent: { termsVersion: string; privacyVersion: string; acceptedAt: string };
}) {
  return parseResponse(
    z.object({
      user,
      verification: z.object({ required: z.boolean(), resendAfterSec: z.number().nonnegative() }),
    }),
    await api('/register', { method: 'POST', json: values }),
  );
}
export async function restore(email: string) {
  return parseResponse(
    z.object({ accepted: z.literal(true), resendAfterSec: z.number().nonnegative() }),
    await api('/password/restore-requests', { method: 'POST', json: { email } }),
  );
}
export async function reset(token: string, newPassword: string) {
  return parseResponse(
    z.object({ passwordChanged: z.literal(true), loginRequired: z.boolean() }),
    await api('/password/resets', { method: 'POST', json: { token, newPassword } }),
  );
}
export async function verify(token: string) {
  return parseResponse(
    z.object({ user }),
    await api('/email/verifications', { method: 'POST', json: { token } }),
  );
}
export async function logout() {
  try {
    await api('/logout', { method: 'POST', json: { allSessions: false } });
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 401)) throw error;
  }
  clearAuthMemory();
}
