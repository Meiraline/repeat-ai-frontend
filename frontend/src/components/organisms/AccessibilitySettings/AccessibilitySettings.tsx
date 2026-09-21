import { Checkbox } from '@/components/atoms/Checkbox';
import { useId } from 'react';
import styles from './AccessibilitySettings.module.css';

export function AccessibilitySettings({
  textSize,
  reduceMotion,
  systemReducedMotion,
  onTextSize,
  onReduceMotion,
}: {
  textSize: string;
  reduceMotion: boolean;
  systemReducedMotion: boolean;
  onTextSize: (value: string) => void;
  onReduceMotion: (value: boolean) => void;
}) {
  const id = useId();
  return (
    <div className={styles.fields}>
      <div className={styles.size}>
        <label htmlFor={`${id}-size`}>Размер текста</label>
        <select
          id={`${id}-size`}
          value={textSize}
          onChange={(event) => onTextSize(event.target.value)}
        >
          <option value="100">100%</option>
          <option value="125">125%</option>
          <option value="150">150%</option>
          <option value="200">200%</option>
        </select>
      </div>
      <label className={styles.motion}>
        <Checkbox
          checked={reduceMotion}
          onChange={(event) => onReduceMotion(event.target.checked)}
          aria-describedby={`${id}-motion-help`}
        />
        Уменьшить движение
      </label>
      <p id={`${id}-motion-help`}>
        Отключает декоративные анимации и плавные переходы.{' '}
        {systemReducedMotion
          ? 'В вашей системе уменьшение движения уже включено и действует независимо от этого переключателя.'
          : 'Системная настройка уменьшения движения также учитывается.'}
      </p>
    </div>
  );
}
