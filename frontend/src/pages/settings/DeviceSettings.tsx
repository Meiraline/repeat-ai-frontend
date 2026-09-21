import { useEffect, useState } from 'react';
import { AccessibilitySettings } from '@/components/organisms/AccessibilitySettings';
import { Button } from '@/components/atoms/Button';
import {
  useDevicePreferences,
  defaultDevicePreferences,
  type DevicePreferences,
} from '@/features/settings';
import styles from './SettingsPage.module.css';

export function DeviceSettings() {
  const { preferences, systemReducedMotion, ready, save } = useDevicePreferences();
  const [draft, setDraft] = useState(preferences);
  const [message, setMessage] = useState('');
  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);
  const dirty =
    draft.textSize !== preferences.textSize || draft.reduceMotion !== preferences.reduceMotion;
  function apply(value: DevicePreferences) {
    const persisted = save({
      ...preferences,
      textSize: value.textSize,
      reduceMotion: value.reduceMotion,
    });
    setMessage(
      persisted
        ? 'Настройки доступности применены и сохранены на устройстве.'
        : 'Настройки применены до перезагрузки страницы. Браузер не разрешил сохранить их на устройстве.',
    );
  }
  return (
    <form
      id="accessibility"
      aria-labelledby="accessibility-title"
      className={styles.panel}
      onSubmit={(event) => {
        event.preventDefault();
        apply(draft);
      }}
    >
      <h2 id="accessibility-title">Доступность</h2>
      <p>
        Эти настройки действуют на всех страницах в этом браузере, в том числе после выхода из
        аккаунта. Они не синхронизируются с другими устройствами.
      </p>
      <fieldset className={styles.deviceFields} disabled={!ready}>
        <legend className="visually-hidden">Настройки доступности на устройстве</legend>
        <AccessibilitySettings
          textSize={draft.textSize}
          reduceMotion={draft.reduceMotion}
          systemReducedMotion={systemReducedMotion}
          onTextSize={(value) => {
            setDraft({ ...draft, textSize: value as DevicePreferences['textSize'] });
            setMessage('');
          }}
          onReduceMotion={(value) => {
            setDraft({ ...draft, reduceMotion: value });
            setMessage('');
          }}
        />
        <p aria-live="polite">
          {message || (dirty ? 'Настройки доступности ещё не применены.' : '')}
        </p>
        <div className={styles.actions}>
          <Button
            variant="neutral"
            onClick={() => {
              setDraft(defaultDevicePreferences);
              apply(defaultDevicePreferences);
            }}
          >
            Сбросить доступность
          </Button>
          <Button
            variant="outline"
            disabled={!dirty}
            onClick={() => {
              setDraft(preferences);
              setMessage('Изменения доступности отменены.');
            }}
          >
            Отменить доступность
          </Button>
          <Button type="submit" disabled={!dirty}>
            Применить доступность
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
