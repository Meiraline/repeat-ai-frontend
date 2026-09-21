import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { z } from 'zod';

export const devicePreferencesKey = 'repeat-device-accessibility-v1';
export const devicePreferencesSchema = z.object({
  textSize: z.enum(['100', '125', '150', '200']),
  reduceMotion: z.boolean(),
  accent: z.enum(['blue', 'purple', 'green']).default('blue'),
});
export type DevicePreferences = z.infer<typeof devicePreferencesSchema>;
export const defaultDevicePreferences: DevicePreferences = {
  textSize: '100',
  reduceMotion: false,
  accent: 'blue',
};
export function parseDevicePreferences(value: string | null): DevicePreferences {
  try {
    return devicePreferencesSchema.parse(JSON.parse(value ?? 'null'));
  } catch {
    return defaultDevicePreferences;
  }
}
const Context = createContext<{
  preferences: DevicePreferences;
  systemReducedMotion: boolean;
  ready: boolean;
  save: (value: DevicePreferences) => boolean;
} | null>(null);

export function DevicePreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(defaultDevicePreferences);
  const [ready, setReady] = useState(false);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  useEffect(() => {
    try {
      setPreferences(parseDevicePreferences(localStorage.getItem(devicePreferencesKey)));
    } catch {
      // Restricted storage must not prevent the application from opening.
    }
    setReady(true);
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setSystemReducedMotion(query.matches);
    syncMotion();
    query.addEventListener('change', syncMotion);
    const syncStorage = (event: StorageEvent) => {
      if (event.storageArea !== localStorage) return;
      if (event.key === devicePreferencesKey || event.key === null) {
        setPreferences(parseDevicePreferences(event.newValue));
      }
    };
    window.addEventListener('storage', syncStorage);
    return () => {
      query.removeEventListener('change', syncMotion);
      window.removeEventListener('storage', syncStorage);
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.textSize = preferences.textSize;
    document.documentElement.dataset.reduceMotion = String(preferences.reduceMotion);
    document.documentElement.dataset.accent = preferences.accent;
    return () => {
      delete document.documentElement.dataset.textSize;
      delete document.documentElement.dataset.reduceMotion;
      delete document.documentElement.dataset.accent;
    };
  }, [preferences, ready]);
  function save(value: DevicePreferences) {
    const parsed = devicePreferencesSchema.parse(value);
    setPreferences(parsed);
    try {
      localStorage.setItem(devicePreferencesKey, JSON.stringify(parsed));
      return true;
    } catch {
      return false;
    }
  }
  return (
    <Context.Provider value={{ preferences, systemReducedMotion, ready, save }}>
      {children}
    </Context.Provider>
  );
}
export function useDevicePreferences() {
  const value = useContext(Context);
  if (!value) throw new Error('DevicePreferencesProvider is missing');
  return value;
}
