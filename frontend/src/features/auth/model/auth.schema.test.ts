import { describe, expect, it } from 'vitest';
import { safeReturnPath, registerSchema, resetSchema, profilePatchSchema } from './auth.schema';
describe('authentication input boundary', () => {
  it('allows only implemented internal return destinations', () => {
    for (const path of [
      'https://evil.test',
      '//evil.test',
      '/\\evil.test',
      '/auth/login',
      '/%2f%2fevil.test',
      '/app\n',
      'javascript:alert(1)',
      '/app/../../outside',
    ])
      expect(safeReturnPath(path)).toBe('/app');
    expect(safeReturnPath('/onboarding')).toBe('/onboarding');
    expect(safeReturnPath('/app/settings')).toBe('/app/settings');
    expect(safeReturnPath('/app/tutor')).toBe('/app/tutor');
    for (const path of [
      '/app/diplomas',
      '/app/tracks/track-1/exam/topic-1',
      '/app/tracks/track-1/project',
      '/app/tracks/track-1/diploma',
    ])
      expect(safeReturnPath(path)).toBe(path);
    expect(safeReturnPath('/app/tracks/track-1/tutor?thread=abc')).toBe(
      '/app/tracks/track-1/tutor?thread=abc',
    );
    expect(safeReturnPath('/app/tracks/track-1/topics/topic-1')).toBe(
      '/app/tracks/track-1/topics/topic-1',
    );
    expect(safeReturnPath('/app/tracks/track-1/knowledge?q=test')).toBe(
      '/app/tracks/track-1/knowledge?q=test',
    );
    expect(safeReturnPath('/app/courses?filter=active')).toBe('/app/courses?filter=active');
  });
  it('requires consent and backend-compatible password strength', () => {
    const data = {
      displayName: '  Анна  ',
      email: 'anna@example.test',
      password: 'Повтор123',
      consent: true,
    };
    expect(registerSchema.parse(data).displayName).toBe('Анна');
    expect(registerSchema.safeParse({ ...data, consent: false }).success).toBe(false);
    expect(registerSchema.safeParse({ ...data, password: 'lowercase123' }).success).toBe(false);
  });
  it('does not accept mismatched passwords', () => {
    expect(
      resetSchema.safeParse({ newPassword: 'Repeat123', confirmation: 'Repeat124' }).success,
    ).toBe(false);
  });
});

it('validates editable profile values before sending a mutation', () => {
  const values = {
    displayName: ' Anna ',
    certificateName: null,
    timezone: 'Asia/Barnaul',
    preferredFormats: ['interactive'],
    weeklyReminderEnabled: true,
  };
  expect(profilePatchSchema.parse(values).displayName).toBe('Anna');
  expect(profilePatchSchema.safeParse({ ...values, displayName: '   ' }).success).toBe(false);
  expect(profilePatchSchema.safeParse({ ...values, timezone: 'invalid-zone' }).success).toBe(false);
  expect(profilePatchSchema.safeParse({ ...values, preferredFormats: ['unknown'] }).success).toBe(
    false,
  );
});
