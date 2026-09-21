import { useId } from 'react';
import { Checkbox, type CheckboxProps } from '@/components/atoms/Checkbox';
import { TextLink } from '@/components/atoms/TextLink';
import styles from './ConsentRow.module.css';
type Props = CheckboxProps & { termsHref: string; privacyHref: string; error?: string };
export function ConsentRow({
  id,
  termsHref,
  privacyHref,
  error,
  'aria-describedby': describedBy,
  ...props
}: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  return (
    <div>
      <div className={styles.row}>
        <Checkbox
          {...props}
          id={inputId}
          aria-labelledby={`${inputId}-text`}
          aria-invalid={!!error || undefined}
          aria-describedby={
            [describedBy, error ? errorId : undefined].filter(Boolean).join(' ') || undefined
          }
        />
        <p className={styles.text} id={`${inputId}-text`}>
          <label htmlFor={inputId}>Я принимаю</label>{' '}
          <TextLink href={termsHref} size="caption">
            условия использования
          </TextLink>{' '}
          и{' '}
          <TextLink href={privacyHref} size="caption">
            политику конфиденциальности
          </TextLink>
        </p>
      </div>
      {error && (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
