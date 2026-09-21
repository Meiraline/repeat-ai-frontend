import { useState } from 'react';
import { Link, useOutletContext } from 'react-router';
import { Button } from '@/components/atoms/Button';
import type { Profile } from '@/features/auth';
import { useDevicePreferences } from '@/features/settings';
import { useMentorPreferences } from '@/features/tutor';
import { settingsExport } from './settings-export';
import styles from './SettingsPage.module.css';

export function PrivacySection() {
  const profile = useOutletContext<Profile>();
  const device = useDevicePreferences();
  const mentor = useMentorPreferences();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  function download() {
    setError('');
    setMessage('');
    let url: string | undefined;
    const link = document.createElement('a');
    try {
      const data = settingsExport(profile, device.preferences, mentor.preferences);
      url = URL.createObjectURL(new Blob([data], { type: 'application/json;charset=utf-8' }));
      link.href = url;
      link.download = 'repeat-settings.json';
      document.body.append(link);
      link.click();
      setMessage('Файл настроек передан браузеру для скачивания. Проверьте список загрузок.');
    } catch {
      setError('Не удалось подготовить файл настроек. Попробуйте ещё раз.');
    } finally {
      link.remove();
      if (url) {
        const createdUrl = url;
        window.setTimeout(() => URL.revokeObjectURL(createdUrl), 30000);
      }
    }
  }
  return (
    <section id="privacy" className={styles.panel} aria-labelledby="privacy-title">
      <h2 id="privacy-title">Приватность и данные</h2>
      <h3>Копия настроек</h3>
      <p>
        JSON-файл содержит загруженный профиль, применённые настройки доступности, оформления и
        наставника. Несохранённые изменения форм в файл не входят.
      </p>
      <p>
        Это не полный архив аккаунта: курсы, переписки, файлы, платежи и сессии не включены. Файл
        создаётся в браузере и никуда не отправляется.
      </p>
      <Button variant="outline" disabled={!device.ready || !mentor.ready} onClick={download}>
        Скачать настройки JSON
      </Button>
      <p role="status">{message}</p>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <h3>Данные аккаунта</h3>
      <p>
        Полный архив, управление хранением истории, персонализацией и удаление аккаунта пока не
        подключены. Изменение настроек наставника не удаляет переписку.
      </p>
      <Link to="/legal/privacy">Политика обработки данных</Link>
    </section>
  );
}
