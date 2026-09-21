import intro from '@/assets/screens/plan-intro.png';
import mentor from '@/assets/screens/plan-mentor.png';

import styles from './PlanIllustration.module.css';
const images = { intro, mentor, risk: intro, summary: intro, generation: intro };
export function PlanIllustration({
  kind,
  title,
  description,
}: {
  kind: keyof typeof images;
  title: string;
  description: string;
}) {
  return (
    <section className={styles.panel}>
      <div className={`${styles.image} ${styles[kind]}`}>
        <img src={images[kind]} alt="" width={300} height={300} />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}
