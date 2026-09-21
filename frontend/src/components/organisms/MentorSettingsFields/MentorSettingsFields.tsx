import { useId } from 'react';
import { Checkbox } from '@/components/atoms/Checkbox';
import { mentorCatalog } from '@/assets/mentors/catalog';
import styles from './MentorSettingsFields.module.css';
type Values = {
  persona: keyof typeof mentorCatalog;
  help: 'hint' | 'explanation' | 'solution';
  detail: 'short' | 'balanced' | 'detailed';
  responseLanguage: 'course' | 'ru' | 'en';
  strictness: 'gentle' | 'balanced' | 'strict';
  exampleFrequency: 'less' | 'normal' | 'more';
  quickAnswers: boolean;
  useAnalogies: boolean;
  guideFirst: boolean;
  askClarifying: boolean;
  suggestNext: boolean;
  checkUnderstanding: boolean;
  suggestPractice: boolean;
  tone: 'professional' | 'friendly' | 'concise';
  warmth: 'less' | 'default' | 'more';
  enthusiasm: 'less' | 'default' | 'more';
  structure: 'less' | 'default' | 'more';
  emoji: 'less' | 'default' | 'more';
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
              'quickAnswers',
              'Быстрые ответы',
              'В демонстрации короткие вопросы получают сокращённый ответ при подробности «Баланс».',
            ],
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
      <fieldset className={styles.initiative}>
        <legend>Стиль общения</legend>
        <p>
          Влияет на форму демонстрационного ответа. Не меняет доступ к материалам и правила проверки
          заданий.
        </p>
        <div className={styles.styleGrid}>
          <div className={styles.options}>
            <label htmlFor={`${id}-tone`}>Базовый стиль и тон</label>
            <select
              id={`${id}-tone`}
              value={value.tone}
              onChange={(event) =>
                onChange({ ...value, tone: event.target.value as Values['tone'] })
              }
            >
              <option value="professional">Профессиональный</option>
              <option value="friendly">Дружелюбный</option>
              <option value="concise">Краткий</option>
            </select>
          </div>
          {(
            [
              ['warmth', 'Тёплый'],
              ['enthusiasm', 'Восторженный'],
              ['structure', 'Заголовки и списки'],
              ['emoji', 'Эмодзи'],
            ] as const
          ).map(([key, label]) => (
            <div className={styles.options} key={key}>
              <label htmlFor={`${id}-${key}`}>{label}</label>
              <select
                id={`${id}-${key}`}
                value={value[key]}
                onChange={(event) =>
                  onChange({ ...value, [key]: event.target.value as Values[typeof key] })
                }
              >
                <option value="less">Менее</option>
                <option value="default">По умолчанию</option>
                <option value="more">Более</option>
              </select>
            </div>
          ))}
        </div>
      </fieldset>
      <fieldset className={styles.initiative}>
        <legend>Расширенное поведение</legend>
        <div className={styles.styleGrid}>
          <div className={styles.options}>
            <label htmlFor={`${id}-responseLanguage`}>Язык ответов</label>
            <select
              id={`${id}-responseLanguage`}
              value={value.responseLanguage}
              onChange={(event) =>
                onChange({
                  ...value,
                  responseLanguage: event.target.value as Values['responseLanguage'],
                })
              }
              aria-describedby={`${id}-language-note`}
            >
              <option value="course">Как в курсе</option>
              <option value="ru">Русский</option>
              <option value="en">Английский</option>
            </select>
          </div>
          <div className={styles.options}>
            <label htmlFor={`${id}-strictness`}>Требовательность</label>
            <select
              id={`${id}-strictness`}
              value={value.strictness}
              onChange={(event) =>
                onChange({ ...value, strictness: event.target.value as Values['strictness'] })
              }
            >
              <option value="gentle">Мягкая</option>
              <option value="balanced">Сбалансированная</option>
              <option value="strict">Высокая</option>
            </select>
          </div>
          <div className={styles.options}>
            <label htmlFor={`${id}-exampleFrequency`}>Частота примеров</label>
            <select
              id={`${id}-exampleFrequency`}
              value={value.exampleFrequency}
              onChange={(event) =>
                onChange({
                  ...value,
                  exampleFrequency: event.target.value as Values['exampleFrequency'],
                })
              }
            >
              <option value="less">Реже</option>
              <option value="normal">Обычно</option>
              <option value="more">Чаще</option>
            </select>
          </div>
        </div>
        <p id={`${id}-language-note`}>
          Язык применяется к демонстрационным примерам и подсказке требовательности, интерфейс
          остаётся русским. «Как в курсе» пока использует русский: язык курса ещё не передаётся
          сервером. Требовательность не меняет оценки. Частота примеров в демонстрации: ни одного,
          один или два.
        </p>
        <p>
          В демонстрации используются шаблонные сравнения и вопросы. Реальный AI пока не подключён.
        </p>
        {(
          [
            [
              'useAnalogies',
              'Использовать аналогии',
              'Добавлять пример сравнения для объяснения темы.',
            ],
            [
              'guideFirst',
              'В заданиях — сначала направлять',
              'Начинать с подсказки. Для примера решения напишите «Покажи решение».',
            ],
            [
              'askClarifying',
              'Задавать уточняющие вопросы',
              'Добавлять вопрос о контексте запроса.',
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
