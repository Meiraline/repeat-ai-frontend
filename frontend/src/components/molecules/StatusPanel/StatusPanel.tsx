import { useId } from 'react';
import { Button } from '@/components/atoms/Button';
import { Spinner } from '@/components/atoms/Spinner';
import styles from './StatusPanel.module.css';

export type StatusPanelProps = {
  title: string;
  description: string;
  state?: 'empty' | 'loading' | 'error';
  onRetry?: () => void;
};

export function StatusPanel({ title, description, state = 'empty', onRetry }: StatusPanelProps) {
  const titleId = useId();
  return (
    <section className={styles.panel} aria-labelledby={titleId} aria-busy={state === 'loading'}>
      {state === 'loading' && <Spinner label="Загружаем данные" size={32} />}
      <h2 id={titleId}>{title}</h2>
      <p role={state === 'error' ? 'alert' : state === 'loading' ? 'status' : undefined}>
        {description}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Повторить
        </Button>
      )}
    </section>
  );
}
