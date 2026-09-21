import { useId } from 'react';
import { mentorCatalog } from '@/assets/mentors/catalog';
import styles from './MentorSettingsFields.module.css';
type Values = {
  persona: keyof typeof mentorCatalog;
  help: 'hint' | 'explanation' | 'solution';
  detail: 'short' | 'balanced' | 'detailed';
};
export function MentorSettingsFields({
  value,
  onChange,
}: {
  value: Values;
  onChange: (value: Values) => void;
}) {
  const id = useId();
  return (
    <div className={styles.fields}>
      <fieldset className={styles.personas}>
        <legend>Наставник</legend>
        {(Object.keys(mentorCatalog) as Values['persona'][]).map((key) => (
          <label key={key} className={styles.persona}>
            <img src={mentorCatalog[key].image} alt="" width={160} height={200} loading="lazy" />
            <span>
              <input
                type="radio"
                name={`${id}-persona`}
                checked={value.persona === key}
                onChange={() => onChange({ ...value, persona: key })}
              />
              {mentorCatalog[key].name}
            </span>
          </label>
        ))}
      </fieldset>
      <div className={styles.options}>
        <label htmlFor={`${id}-help`}>Предпочитаемый формат помощи</label>
        <select
          id={`${id}-help`}
          value={value.help}
          onChange={(event) => onChange({ ...value, help: event.target.value as Values['help'] })}
        >
          <option value="hint">Подсказка</option>
          <option value="explanation">Объяснение</option>
          <option value="solution">Решение</option>
        </select>
        <label htmlFor={`${id}-detail`}>Подробность ответа</label>
        <select
          id={`${id}-detail`}
          value={value.detail}
          onChange={(event) =>
            onChange({ ...value, detail: event.target.value as Values['detail'] })
          }
        >
          <option value="short">Кратко</option>
          <option value="balanced">Баланс</option>
          <option value="detailed">Подробно</option>
        </select>
      </div>
    </div>
  );
}
