import { Input } from '@/components/atoms/Input';
import { Checkbox } from '@/components/atoms/Checkbox';
import styles from './ProfileSettingsFields.module.css';
export type ProfileSettingsValues = {
  displayName: string;
  certificateName: string | null;
  timezone: string;
  preferredFormats: string[];
  weeklyReminderEnabled: boolean;
};
const zones = [
  'Europe/Kaliningrad',
  'Europe/Moscow',
  'Europe/Samara',
  'Asia/Yekaterinburg',
  'Asia/Omsk',
  'Asia/Novosibirsk',
  'Asia/Barnaul',
  'Asia/Krasnoyarsk',
  'Asia/Irkutsk',
  'Asia/Yakutsk',
  'Asia/Vladivostok',
  'Asia/Magadan',
  'Asia/Kamchatka',
  'UTC',
];
const formats = [
  ['article', 'Статьи'],
  ['video', 'Видео'],
  ['audio', 'Аудио'],
  ['official_document', 'Документация'],
  ['interactive', 'Интерактивные материалы'],
] as const;

export function ProfileSettingsFields({
  draft,
  busy,
  change,
}: {
  draft: ProfileSettingsValues;
  busy: boolean;
  change: <K extends keyof ProfileSettingsValues>(key: K, value: ProfileSettingsValues[K]) => void;
}) {
  return (
    <fieldset disabled={busy} className={styles.grid}>
      <section id="profile" className={styles.card} aria-labelledby="profile-heading">
        <h3 id="profile-heading">Профиль</h3>
        <p>Как сервис и ИИ-наставник обращаются к вам.</p>
        <Input
          label="Как вас называть"
          value={draft.displayName}
          maxLength={100}
          required
          onChange={(e) => change('displayName', e.target.value)}
          autoComplete="nickname"
        />
        <Input
          label="Имя на дипломе"
          value={draft.certificateName ?? ''}
          maxLength={100}
          onChange={(e) => change('certificateName', e.target.value)}
          autoComplete="name"
        />
        <p>Имя для будущих дипломов. Уже выданные документы не изменяются.</p>
      </section>
      <section id="region" className={styles.card} aria-labelledby="region-heading">
        <h3 id="region-heading">Регион и время</h3>
        <p>Часовой пояс вашего профиля.</p>
        <label htmlFor="timezone">Часовой пояс</label>
        <select
          id="timezone"
          value={draft.timezone}
          onChange={(e) => change('timezone', e.target.value)}
        >
          {[...new Set([draft.timezone, ...zones])].map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
        <p>
          Язык интерфейса — русский. Сейчас доступна светлая тема. Масштаб и размер текста можно
          менять в браузере.
        </p>
      </section>
      <section
        id="learning"
        className={`${styles.card} ${styles.wide}`}
        aria-labelledby="learning-heading"
      >
        <h3 id="learning-heading">Обучение и уведомления</h3>
        <fieldset className={styles.formats}>
          <legend>Предпочитаемые форматы материалов</legend>
          {formats.map(([value, label]) => (
            <label key={value}>
              <Checkbox
                checked={draft.preferredFormats.includes(value)}
                onChange={(e) =>
                  change(
                    'preferredFormats',
                    e.target.checked
                      ? [...draft.preferredFormats, value]
                      : draft.preferredFormats.filter((item) => item !== value),
                  )
                }
              />
              {label}
            </label>
          ))}
        </fieldset>
        <label className={styles.check}>
          <Checkbox
            checked={draft.weeklyReminderEnabled}
            onChange={(e) => change('weeklyReminderEnabled', e.target.checked)}
          />
          Еженедельное напоминание об обучении
        </label>
        <p>Сохраняются предпочтения профиля. Настройки уже созданных курсов не изменяются.</p>
      </section>
    </fieldset>
  );
}
