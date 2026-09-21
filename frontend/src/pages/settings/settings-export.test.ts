import { expect, it } from 'vitest';
import { defaultDevicePreferences } from '@/features/settings';
import { defaultMentorPreferences } from '@/features/tutor';
import { settingsExport } from './settings-export';

it('exports allowlisted preferences without unknown private fields or mutating the source', () => {
  const profile = {
    displayName: 'Анна',
    certificateName: null,
    timezone: 'UTC',
    language: 'ru',
    preferredFormats: ['article'],
    weeklyReminderEnabled: false,
    version: 2,
    token: 'private-token',
  };
  const data = JSON.parse(
    settingsExport(
      profile,
      { ...defaultDevicePreferences, secret: 'no' } as typeof defaultDevicePreferences,
      defaultMentorPreferences,
    ),
  );
  expect(data.format).toBe('repeat-settings');
  expect(data.profile.displayName).toBe('Анна');
  expect(data.profile).not.toHaveProperty('token');
  expect(data.device).not.toHaveProperty('secret');
  expect(data.mentor).toEqual(defaultMentorPreferences);
  expect(profile.token).toBe('private-token');
});
