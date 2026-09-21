import { useId, useState } from 'react';
import { Input, type InputProps } from '@/components/atoms/Input';
import { IconButton } from '@/components/atoms/IconButton';
import styles from './TextField.module.css';
export type TextFieldProps = InputProps & {
  hint?: string;
  error?: string;
  allowPasswordReveal?: boolean;
};
export function TextField({
  id,
  type = 'text',
  hint,
  error,
  allowPasswordReveal = true,
  disabled,
  trailingAction,
  'aria-describedby': describedBy,
  'aria-errormessage': errorMessage,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [revealed, setRevealed] = useState(false);
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const descriptions =
    [describedBy, hint ? hintId : undefined, error ? errorId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;
  return (
    <div className={styles.field}>
      <Input
        {...props}
        id={inputId}
        disabled={disabled}
        type={type === 'password' && revealed ? 'text' : type}
        invalid={!!error || props.invalid}
        aria-describedby={descriptions}
        aria-errormessage={error ? errorId : errorMessage}
        trailingAction={
          type === 'password' && allowPasswordReveal ? (
            <IconButton
              icon="eye"
              appearance="plain"
              label={revealed ? 'Скрыть пароль' : 'Показать пароль'}
              aria-pressed={revealed}
              aria-controls={inputId}
              disabled={disabled}
              onClick={() => setRevealed(!revealed)}
            />
          ) : (
            trailingAction
          )
        }
      />
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
