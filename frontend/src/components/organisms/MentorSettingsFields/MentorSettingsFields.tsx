import { useId } from 'react';
import { Checkbox } from '@/components/atoms/Checkbox';
import { mentorCatalog } from '@/assets/mentors/catalog';
import styles from './MentorSettingsFields.module.css';
type Values = {
  persona: keyof typeof mentorCatalog;
  help: 'hint' | 'explanation' | 'solution';
  detail: 'short' | 'balanced' | 'detailed';
  suggestNext: boolean;
  checkUnderstanding: boolean;
  suggestPractice: boolean;
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
      <fieldset className={styles.initiative}>
        <legend>Инициативность</legend>
        <p>
          Дополнительные предложения после ответа. В демонстрации используются примеры без оценки
          ваших знаний.
        </p>
        {(
          [
            [
              'suggestNext',
              'Предлагаемые подсказки',
              'Предлагать следующий вопрос для разбора темы.',
            ],
            [
              'checkUnderstanding',
              'Проверять понимание',
              'Добавлять короткий вопрос для самостоятельной проверки.',
            ],
            [
              'suggestPractice',
              'Предлагать практику',
              'Предлагать небольшое практическое задание.',
            ],
          ] as const
        ).map(([key, label, description]) => (
          <div key={key}>
            <label className={styles.toggle}>
              <Checkbox
                checked={value[key]}
                onChange={(event) => onChange({ ...value, [key]: event.target.checked })}
                aria-describedby={`${id}-${key}`}
              />
              {label}
            </label>
            <p id={`${id}-${key}`}>{description}</p>
          </div>
        ))}
      </fieldset>
    </div>
  );
}
