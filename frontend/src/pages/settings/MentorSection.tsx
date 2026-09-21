import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { MentorSettingsFields } from '@/components/organisms/MentorSettingsFields';
import { Button } from '@/components/atoms/Button';
import {
  useMentorPreferences,
  defaultMentorPreferences,
  type MentorPreferences,
} from '@/features/tutor';
import styles from './SettingsPage.module.css';
export function MentorSection() {
  const { preferences, ready, save } = useMentorPreferences();
  const [draft, setDraft] = useState(preferences),
    [message, setMessage] = useState('');
  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(preferences);
  function apply(value: MentorPreferences) {
    setDraft(value);
    setMessage(
      save(value)
        ? 'Настройки наставника сохранены на устройстве.'
        : 'Настройки применены до перезагрузки. Браузер не разрешил сохранить настройки наставника.',
    );
  }
  return (
    <form
      id="mentor"
      className={styles.panel}
      aria-labelledby="mentor-title"
      onSubmit={(event) => {
        event.preventDefault();
        apply(draft);
      }}
    >
      <h2 id="mentor-title">ИИ-наставник</h2>
      <p>
        Выбор действует для новых сообщений в этом браузере, в том числе после выхода из аккаунта.
        Старые ответы не меняются. Настройки не синхронизируются с другими устройствами.
      </p>
      <p className={styles.notice}>
        Реальный AI пока не подключён. В демонстрационном чате можно проверить передачу выбранного
        формата и подробности. Выбор персонажа меняет его изображение и имя; характер ответов AI ещё
        не реализован.
      </p>
      <fieldset className={styles.deviceFields} disabled={!ready}>
        <legend className="visually-hidden">Параметры наставника</legend>
        <MentorSettingsFields
          value={draft}
          onChange={(value) => {
            setDraft(value);
            setMessage('');
          }}
        />
        <p aria-live="polite">
          {message || (dirty ? 'Есть неприменённые настройки наставника.' : '')}
        </p>
        <div className={styles.actions}>
          <Button variant="neutral" onClick={() => apply(defaultMentorPreferences)}>
            Сбросить наставника
          </Button>
          <Button
            variant="outline"
            disabled={!dirty}
            onClick={() => {
              setDraft(preferences);
              setMessage('Изменения наставника отменены.');
            }}
          >
            Отменить настройки наставника
          </Button>
          <Button type="submit" disabled={!dirty}>
            Сохранить настройки наставника
          </Button>
        </div>
      </fieldset>
      <Link to="/app/tutor">Открыть AI-репетитора</Link>
    </form>
  );
}
