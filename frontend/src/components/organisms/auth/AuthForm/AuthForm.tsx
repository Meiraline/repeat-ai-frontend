import { useRef, type ReactNode, type FormEvent } from 'react';
import { TextField } from '@/components/molecules/TextField';
import { ConsentRow } from '@/components/molecules/ConsentRow';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/quarks/Icon';
import styles from './AuthForm.module.css';

export type AuthField = {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  autoComplete?: string;
  hint?: string;
  maxLength?: number;
};
type Props = {
  title: string;
  description: string;
  fields: AuthField[];
  errors: Record<string, string>;
  pending: boolean;
  submitLabel: string;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  consent?: boolean;
  disabled?: boolean;
  beforeSubmit?: ReactNode;
  footer?: ReactNode;
};
export function AuthForm({
  title,
  description,
  fields,
  errors,
  pending,
  submitLabel,
  onSubmit,
  consent,
  disabled,
  beforeSubmit,
  footer,
}: Props) {
  const lock = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || disabled || lock.current) return;
    const form = event.currentTarget;
    lock.current = true;
    try {
      await onSubmit(
        Object.fromEntries([
          ...new FormData(form),
          ['consent', new FormData(form).get('consent') === 'on'],
        ]),
      );
    } finally {
      lock.current = false;
      requestAnimationFrame(() =>
        form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
    }
  }
  return (
    <form className={styles.form} onSubmit={(event) => void submit(event)} noValidate>
      <h1>{title}</h1>
      <p className={styles.description}>{description}</p>
      {errors.form && (
        <p className={styles.error} role="alert">
          {errors.form}
        </p>
      )}
      {fields.map((field) => (
        <TextField
          key={field.name}
          {...field}
          size="large"
          error={errors[field.name]}
          disabled={pending}
          placeholder={
            field.type === 'email'
              ? 'name@example.ru'
              : field.type === 'password'
                ? 'Введите пароль'
                : 'Ваше имя'
          }
          leadingIcon={
            field.type === 'email' ? (
              <Icon name="mail" size={32} />
            ) : field.type === 'password' ? (
              <Icon name="lock" size={32} />
            ) : (
              <Icon name="user" size={32} />
            )
          }
        />
      ))}
      {consent && (
        <ConsentRow
          name="consent"
          termsHref="/legal/terms"
          privacyHref="/legal/privacy"
          error={errors.consent}
          disabled={pending}
        />
      )}
      {beforeSubmit}
      <Button type="submit" size="auth" fullWidth loading={pending} disabled={disabled}>
        {submitLabel}
      </Button>
      {footer}
    </form>
  );
}
