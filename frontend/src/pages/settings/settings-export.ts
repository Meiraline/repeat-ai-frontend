import { profileSchema, type Profile } from '@/features/auth';
import { devicePreferencesSchema, type DevicePreferences } from '@/features/settings';
import { mentorPreferencesSchema, type MentorPreferences } from '@/features/tutor';

export function settingsExport(
  profile: Profile,
  device: DevicePreferences,
  mentor: MentorPreferences,
) {
  return JSON.stringify(
    {
      format: 'repeat-settings',
      version: 1,
      exportedAt: new Date().toISOString(),
      scope: 'Settings only; excludes courses, chats, files, billing and sessions.',
      profile: profileSchema.parse(profile),
      device: devicePreferencesSchema.parse(device),
      mentor: mentorPreferencesSchema.parse(mentor),
    },
    null,
    2,
  );
}
