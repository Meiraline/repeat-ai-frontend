import styles from './PlanDiffRow.module.css';
export function PlanDiffRow({
  title,
  before,
  after,
}: {
  title: string;
  before: string;
  after: string;
}) {
  return (
    <section className={styles.row}>
      <h3>{title}</h3>
      <dl>
        <div>
          <dt>Было</dt>
          <dd>{before}</dd>
        </div>
        <div>
          <dt>Станет</dt>
          <dd>{after}</dd>
        </div>
      </dl>
    </section>
  );
}
