import { describe, expect, it } from 'vitest';
import {
  defaultMentorPreferences,
  parseMentorPreferences,
  mentorPreferencesSchema,
} from './preferences.schema';
import { tutorMessageSchema, tutorSendSchema } from './tutor.schema';
describe('mentor preferences', () => {
  it('migrates communication style and rejects unknown levels', () => {
    const legacy = { persona: 'lira', help: 'hint', detail: 'balanced' };
    expect(mentorPreferencesSchema.parse(legacy)).toEqual(defaultMentorPreferences);
    expect(mentorPreferencesSchema.safeParse({ ...legacy, warmth: 'very warm' }).success).toBe(
      false,
    );
    expect(mentorPreferencesSchema.parse({ ...legacy, tone: 'friendly', emoji: 'more' }).tone).toBe(
      'friendly',
    );
  });
  it('migrates previous snapshots without enabling unsolicited additions', () => {
    const previous = { persona: 'vector', help: 'hint', detail: 'short' };
    expect(mentorPreferencesSchema.parse(previous)).toEqual({
      ...defaultMentorPreferences,
      ...previous,
    });
    expect(mentorPreferencesSchema.safeParse({ ...previous, suggestNext: 'true' }).success).toBe(
      false,
    );
    expect(
      mentorPreferencesSchema.parse({ ...previous, suggestPractice: true }).suggestPractice,
    ).toBe(true);
  });
  it('validates stored settings and rejects corrupted or unsupported values', () => {
    for (const value of [null, '{', '{}', '{"persona":"unknown","help":"hint","detail":"short"}'])
      expect(parseMentorPreferences(value)).toEqual(defaultMentorPreferences);
    expect(
      parseMentorPreferences('{"persona":"vector","help":"solution","detail":"detailed"}'),
    ).toEqual({
      ...defaultMentorPreferences,
      persona: 'vector',
      help: 'solution',
      detail: 'detailed',
    });
  });
  it('keeps legacy messages readable and validates request snapshots', () => {
    expect(
      tutorMessageSchema.parse({
        id: '1',
        clientMessageId: '1',
        role: 'assistant',
        blocks: [],
        status: 'complete',
        contextVersion: 1,
        sources: [],
      }).preferences,
    ).toEqual(defaultMentorPreferences);
    expect(
      tutorSendSchema.safeParse({
        text: 'hello',
        contextVersion: 1,
        clientMessageId: crypto.randomUUID(),
        preferences: { ...defaultMentorPreferences, detail: 'invalid' },
      }).success,
    ).toBe(false);
  });
});
