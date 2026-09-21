import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import styles from './Input.module.css';
export type InputProps = Omit<ComponentPropsWithRef<'input'>, 'size'> & {
  label: string;
  size?: 'medium' | 'large';
  invalid?: boolean;
  leadingIcon?: ReactNode;
  trailingAction?: ReactNode;
};
export function Input({
  label,
  id,
  size = 'medium',
  invalid = false,
  leadingIcon,
  trailingAction,
  className = '',
  disabled,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div
      className={`${styles.root} ${invalid ? styles.invalid : ''} ${disabled ? styles.disabled : ''} ${className}`}
    >
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <div className={`${styles.control} ${styles[size]}`}>
        {leadingIcon && <span className={styles.leading}>{leadingIcon}</span>}
        <input
          {...props}
          id={inputId}
          disabled={disabled}
          aria-invalid={invalid || props['aria-invalid']}
          className={styles.input}
        />
        {trailingAction}
      </div>
    </div>
  );
}
