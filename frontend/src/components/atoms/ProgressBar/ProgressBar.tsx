import styles from './ProgressBar.module.css';
export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <progress className={styles.bar} max={100} value={value} aria-label={label}>
      {value}%
    </progress>
  );
}
