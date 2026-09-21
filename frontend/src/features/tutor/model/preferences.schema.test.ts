import { describe, expect, it } from 'vitest';
import { defaultMentorPreferences, parseMentorPreferences } from './preferences.schema';
import { tutorMessageSchema, tutorSendSchema } from './tutor.schema';
describe('mentor preferences', () => {
  it('validates stored settings and rejects corrupted or unsupported values', () => {
    for (const value of [null, '{', '{}', '{"persona":"unknown","help":"hint","detail":"short"}'])
      expect(parseMentorPreferences(value)).toEqual(defaultMentorPreferences);
    expect(
      parseMentorPreferences('{"persona":"vector","help":"solution","detail":"detailed"}'),
    ).toEqual({ persona: 'vector', help: 'solution', detail: 'detailed' });
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
