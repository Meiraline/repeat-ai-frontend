import { ChoiceGroup, type Choice } from '@/components/molecules/ChoiceGroup';
import { TextField } from '@/components/molecules/TextField';
import { Button } from '@/components/atoms/Button';
import styles from './OnboardingForm.module.css';
export type PreferenceField = {
  key: string;
  label: string;
  options?: Choice[];
  multiple?: boolean;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
};
export type PreferenceValues = Record<string, string | string[] | boolean>;
type Props = {
  step: number;
  title: string;
  description?: string;
  fields: PreferenceField[];
  values: PreferenceValues;
  pending: boolean;
  error?: string;
  onChange: (key: string, value: string | string[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
};
export function OnboardingForm({
  step,
  title,
  description,
  fields,
  values,
  pending,
  error,
  onChange,
  onNext,
  onBack,
  onSkip,
}: Props) {
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        if (!pending) onNext();
      }}
    >
      {step >= 2 && step <= 8 && (
        <div className={styles.progress}>
          <span>{step - 1} из 7</span>
          <progress max={7} value={step - 1} aria-label="Знакомство с сервисом" />
        </div>
      )}
      <h1 tabIndex={-1}>{title}</h1>
      {description && <p className={styles.description}>{description}</p>}
      {step === 1 && (
        <ol className={styles.flow}>
          {[
            'Курс — отдельная цель',
            'План — маршрут и расписание',
            'AI — объяснения и практика',
            'Аналитика — прогресс и прогноз',
            'База знаний — материалы и источники',
            'Экзамен — контроль знаний',
            'Диплом — результат курса',
          ].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      )}
      {fields.map((field) =>
        field.options ? (
          <div key={field.key}>
            <ChoiceGroup
              label={field.label}
              options={field.options}
              multiple={field.multiple}
              disabled={pending || field.disabled}
              value={
                typeof values[field.key] === 'boolean'
                  ? ''
                  : ((values[field.key] as string | string[]) ?? (field.multiple ? [] : ''))
              }
              onChange={(value) => onChange(field.key, value)}
            />
            {field.hint && <p className={styles.hint}>{field.hint}</p>}
          </div>
        ) : (
          <TextField
            key={field.key}
            label={field.label}
            hint={field.hint}
            value={String(values[field.key] ?? '')}
            onChange={(e) => onChange(field.key, e.target.value)}
            disabled={pending || field.disabled}
            required={field.required}
            maxLength={200}
            autoComplete={
              field.key === 'displayName'
                ? 'nickname'
                : field.key === 'certificateName'
                  ? 'name'
                  : 'off'
            }
          />
        ),
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <Button type="submit" size="auth" loading={pending} fullWidth>
        {step === 0
          ? 'Продолжить'
          : step === 1
            ? 'Начать знакомство'
            : step === 8
              ? 'Завершить знакомство'
              : 'Продолжить'}
      </Button>
      <div className={styles.actions}>
        <Button size="small" variant="neutral" onClick={onBack} disabled={pending}>
          Назад
        </Button>
        {step <= 1 && (
          <Button size="small" variant="neutral" onClick={onSkip} disabled={pending}>
            Пропустить
          </Button>
        )}
      </div>
    </form>
  );
}
