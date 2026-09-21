import { useId } from 'react';
import styles from './ChoiceGroup.module.css';
export type Choice = { value: string; label: string; description?: string; image?: string };
export function ChoiceGroup({
  label,
  options,
  value,
  multiple = false,
  disabled = false,
  onChange,
}: {
  label: string;
  options: Choice[];
  value: string | string[];
  multiple?: boolean;
  disabled?: boolean;
  onChange: (value: string | string[]) => void;
}) {
  const name = useId();
  return (
    <fieldset className={styles.group} disabled={disabled}>
      <legend>{label}</legend>
      <div className={styles.options}>
        {options.map((option) => {
          const selected = Array.isArray(value)
            ? value.includes(option.value)
            : value === option.value;
          return (
            <label
              key={option.value}
              className={`${styles.option} ${selected ? styles.selected : ''} ${option.image ? styles.portrait : ''}`}
            >
              <input
                type={multiple ? 'checkbox' : 'radio'}
                name={name}
                value={option.value}
                checked={selected}
                onChange={() =>
                  onChange(
                    multiple
                      ? selected
                        ? (Array.isArray(value) ? value : []).filter((v) => v !== option.value)
                        : [...(Array.isArray(value) ? value : []), option.value]
                      : option.value,
                  )
                }
              />
              {option.image && (
                <img src={option.image} alt="" width="220" height="280" loading="lazy" />
              )}
              <span>{option.label}</span>
              {option.description && <small>{option.description}</small>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
