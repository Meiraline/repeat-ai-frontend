import { describe, expect, it } from 'vitest';
import { defaultDevicePreferences, parseDevicePreferences } from './device-preferences';
describe('device preference storage', () => {
  it('rejects corrupted or unsupported persisted settings', () => {
    for (const value of [
      null,
      '{',
      '{}',
      '{"textSize":"900","reduceMotion":false}',
      '{"textSize":"125","reduceMotion":"false"}',
    ]) {
      expect(parseDevicePreferences(value)).toEqual(defaultDevicePreferences);
    }
  });
  it('restores valid settings and drops unrelated fields', () => {
    expect(parseDevicePreferences('{"textSize":"150","reduceMotion":true,"extra":true}')).toEqual({
      textSize: '150',
      reduceMotion: true,
      accent: 'blue',
    });
  });
  it('preserves a supported accent and rejects unknown accents', () => {
    expect(
      parseDevicePreferences('{"textSize":"125","reduceMotion":false,"accent":"green"}').accent,
    ).toBe('green');
    expect(
      parseDevicePreferences('{"textSize":"125","reduceMotion":false,"accent":"red"}'),
    ).toEqual(defaultDevicePreferences);
  });
});
