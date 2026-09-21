import { useEffect, useRef, useId } from 'react';
import { Button } from '@/components/atoms/Button';
import styles from './InterviewForm.module.css';
type Props = {
  question: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onSave: () => void;
  onBack?: () => void;
  busy: boolean;
  error?: string;
  type?: 'text' | 'date' | 'number';
  maxLength?: number;
};
export function InterviewForm({
  question,
  hint,
  value,
  onChange,
  onSubmit,
  onSave,
  onBack,
  busy,
  error,
  type = 'text',
  maxLength = 2000,
}: Props) {
  const id = useId(),
    ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, [question]);
  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className={styles.question}>
        <small>Лира · текущий вопрос</small>
        <h2 ref={ref} tabIndex={-1}>
          {question}
        </h2>
        <p>{hint}</p>
      </div>
      <label htmlFor={id}>Ваш ответ</label>
      {type === 'text' ? (
        <textarea
          id={id}
          value={value}
          maxLength={maxLength}
          disabled={busy}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              onSubmit();
            }
          }}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          disabled={busy}
          onChange={(e) => onChange(e.target.value)}
          step={type === 'number' ? 0.5 : undefined}
          min={type === 'number' ? 0.5 : undefined}
          max={type === 'number' ? 80 : undefined}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      )}
      {error && (
        <p id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
      <small>
        Ответ сохраняется после нажатия «Продолжить» или «Сохранить и выйти». Enter — продолжить,
        Shift+Enter — новая строка.
      </small>
      <div className={styles.actions}>
        {onBack && (
          <Button variant="outline" disabled={busy} onClick={onBack}>
            Назад
          </Button>
        )}
        <Button type="submit" loading={busy}>
          Продолжить
        </Button>
        <Button variant="neutral" disabled={busy} onClick={onSave}>
          Сохранить и выйти
        </Button>
      </div>
    </form>
  );
}
