import { useId } from 'react';
import styles from './AppearanceSettings.module.css';

export type Accent = 'blue' | 'purple' | 'green';
const options = [
  ['blue', 'Синий'],
  ['purple', 'Фиолетовый'],
  ['green', 'Зелёный'],
] as const;
export function AppearanceSettings({
  accent,
  onChange,
}: {
  accent: Accent;
  onChange: (accent: Accent) => void;
}) {
  const id = useId();
  return (
    <div className={styles.layout}>
      <fieldset className={styles.options}>
        <legend>Акцентный цвет</legend>
        {options.map(([value, label]) => (
          <label key={value} className={styles.option}>
            <input
              type="radio"
              name={`${id}-accent`}
              value={value}
              checked={accent === value}
              onChange={() => onChange(value)}
            />
            <span className={`${styles.swatch} ${styles[value]}`} aria-hidden="true" />
            {label}
          </label>
        ))}
      </fieldset>
      <section className={styles.preview} data-accent={accent} aria-label="Предпросмотр оформления">
        <h3>Учебный план</h3>
        <p>Так будут выглядеть основные акценты интерфейса.</p>
        <span className={styles.example}>Продолжить</span>
        <p className={styles.caption}>Образец оформления кнопки</p>
      </section>
    </div>
  );
}
