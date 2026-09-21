import { useEffect, useState } from 'react';
import { AppearanceSettings } from '@/components/organisms/AppearanceSettings';
import { Button } from '@/components/atoms/Button';
import { useDevicePreferences } from '@/features/settings';
import styles from './SettingsPage.module.css';
export function AppearanceSection() {
  const { preferences, ready, save } = useDevicePreferences();
  const [accent, setAccent] = useState(preferences.accent);
  const [message, setMessage] = useState('');
  useEffect(() => {
    setAccent(preferences.accent);
  }, [preferences.accent]);
  function apply(value: typeof accent) {
    setAccent(value);
    setMessage(
      save({ ...preferences, accent: value })
        ? 'Оформление применено и сохранено на устройстве.'
        : 'Оформление применено до перезагрузки. Браузер не разрешил сохранить выбор.',
    );
  }
  const dirty = accent !== preferences.accent;
  return (
    <form
      id="appearance"
      className={styles.panel}
      aria-labelledby="appearance-title"
      onSubmit={(event) => {
        event.preventDefault();
        apply(accent);
      }}
    >
      <h2 id="appearance-title">Оформление</h2>
      <p>
        Акцентный цвет кнопок, ссылок и выделений сохраняется в этом браузере. Иллюстрации и логотип
        сохраняют оригинальные цвета. Сейчас доступна светлая тема.
      </p>
      <fieldset className={styles.deviceFields} disabled={!ready}>
        <legend className="visually-hidden">Настройки оформления на устройстве</legend>
        <AppearanceSettings
          accent={accent}
          onChange={(value) => {
            setAccent(value);
            setMessage('');
          }}
        />
        <p aria-live="polite">
          {message ||
            (dirty
              ? 'Выбранный цвет показан в предпросмотре. Примените его для всех страниц.'
              : '')}
        </p>
        <div className={styles.actions}>
          <Button variant="neutral" onClick={() => apply('blue')}>
            Сбросить оформление
          </Button>
          <Button
            variant="outline"
            disabled={!dirty}
            onClick={() => {
              setAccent(preferences.accent);
              setMessage('Изменения оформления отменены.');
            }}
          >
            Отменить оформление
          </Button>
          <Button type="submit" disabled={!dirty}>
            Применить оформление
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
