import { Button } from '@/components/atoms/Button';
import { ProgressBar } from '@/components/atoms/ProgressBar';
import styles from './CourseCard.module.css';
type Props = {
  title: string;
  progress: number;
  topic?: string;
  risk?: string | null;
  deadline?: string | null;
  onOpen: () => void;
};
export function CourseCard({ title, progress, topic, risk, deadline, onOpen }: Props) {
  return (
    <article className={styles.card}>
      <h3>{title}</h3>
      {risk && (
        <span className={styles.badge}>{risk === 'overdue' ? 'Срок прошёл' : 'Скоро дедлайн'}</span>
      )}
      <p>{progress}% пройдено</p>
      <ProgressBar value={progress} label={`Прогресс: ${title}`} />
      <div className={styles.next}>
        <small>Следующий шаг</small>
        <p>{topic ?? 'Открыть программу'}</p>
      </div>
      {deadline && <p>До {new Date(deadline).toLocaleDateString('ru-RU')}</p>}
      <Button variant="outline" fullWidth onClick={onOpen}>
        Программа
      </Button>
      <small>Продолжение обучения — на следующем этапе</small>
    </article>
  );
}
