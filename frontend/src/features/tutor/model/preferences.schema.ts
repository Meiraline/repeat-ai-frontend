import { z } from 'zod';
export const mentorPreferencesSchema = z.object({
  persona: z.enum(['lira', 'vector', 'cypher', 'astra']),
  help: z.enum(['hint', 'explanation', 'solution']),
  detail: z.enum(['short', 'balanced', 'detailed']),
  responseLanguage: z.enum(['course', 'ru', 'en']).default('course'),
  strictness: z.enum(['gentle', 'balanced', 'strict']).default('balanced'),
  exampleFrequency: z.enum(['less', 'normal', 'more']).default('normal'),
  quickAnswers: z.boolean().default(false),
  useAnalogies: z.boolean().default(false),
  guideFirst: z.boolean().default(false),
  askClarifying: z.boolean().default(false),
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
  responseLanguage: 'course',
  strictness: 'balanced',
  exampleFrequency: 'normal',
  quickAnswers: false,
  useAnalogies: false,
  guideFirst: false,
  askClarifying: false,
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
