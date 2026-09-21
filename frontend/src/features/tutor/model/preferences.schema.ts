import { z } from 'zod';
export const mentorPreferencesSchema = z.object({
  persona: z.enum(['lira', 'vector', 'cypher', 'astra']),
  help: z.enum(['hint', 'explanation', 'solution']),
  detail: z.enum(['short', 'balanced', 'detailed']),
  suggestNext: z.boolean().default(false),
  checkUnderstanding: z.boolean().default(false),
  suggestPractice: z.boolean().default(false),
  tone: z.enum(['professional', 'friendly', 'concise']).default('professional'),
  warmth: z.enum(['less', 'default', 'more']).default('default'),
  enthusiasm: z.enum(['less', 'default', 'more']).default('default'),
  structure: z.enum(['less', 'default', 'more']).default('default'),
  emoji: z.enum(['less', 'default', 'more']).default('default'),
});
export type MentorPreferences = z.infer<typeof mentorPreferencesSchema>;
export const defaultMentorPreferences: MentorPreferences = {
  persona: 'lira',
  help: 'hint',
  detail: 'balanced',
  suggestNext: false,
  checkUnderstanding: false,
  suggestPractice: false,
  tone: 'professional',
  warmth: 'default',
  enthusiasm: 'default',
  structure: 'default',
  emoji: 'default',
};
export function parseMentorPreferences(value: string | null): MentorPreferences {
  try {
    return mentorPreferencesSchema.parse(JSON.parse(value ?? 'null'));
  } catch {
    return defaultMentorPreferences;
  }
}
