import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/quarks/Icon';
import { ProgressBar } from '@/components/atoms/ProgressBar';
import styles from './RoadmapTopic.module.css';
export function RoadmapTopic({
  title,
  status,
  progress,
  reason,
  selected,
  onOpen,
}: {
  title: string;
  status: string;
  progress: number;
  reason: string | null;
  selected: boolean;
  onOpen: () => void;
}) {
  return (
    <li className={styles.topic} data-selected={selected}>
      <Icon name="book" size={28} />
      <div>
        <h3>{title}</h3>
        <p>
          {status} · {progress}%
        </p>
        <ProgressBar label={`Прогресс: ${title}`} value={progress} />
        {reason && <p>{reason}</p>}
        <Button variant={selected ? 'primary' : 'outline'} size="small" onClick={onOpen}>
          {reason ? 'Условия открытия' : 'Открыть тему'}
        </Button>
      </div>
    </li>
  );
}
