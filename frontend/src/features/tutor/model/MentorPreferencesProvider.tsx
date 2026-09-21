import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  defaultMentorPreferences,
  mentorPreferencesSchema,
  parseMentorPreferences,
  type MentorPreferences,
} from './preferences.schema';
const key = 'repeat-device-mentor-v1';
const Context = createContext<{
  preferences: MentorPreferences;
  ready: boolean;
  save: (value: MentorPreferences) => boolean;
} | null>(null);
export function MentorPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(defaultMentorPreferences);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      setPreferences(parseMentorPreferences(localStorage.getItem(key)));
    } catch {
      /* Storage may be restricted; defaults remain usable. */
    }
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.storageArea === localStorage && (event.key === key || event.key === null))
        setPreferences(parseMentorPreferences(event.newValue));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  function save(value: MentorPreferences) {
    const parsed = mentorPreferencesSchema.parse(value);
    setPreferences(parsed);
    try {
      localStorage.setItem(key, JSON.stringify(parsed));
      return true;
    } catch {
      return false;
    }
  }
  return <Context.Provider value={{ preferences, ready, save }}>{children}</Context.Provider>;
}
export function useMentorPreferences() {
  const value = useContext(Context);
  if (!value) throw new Error('MentorPreferencesProvider is missing');
  return value;
}
