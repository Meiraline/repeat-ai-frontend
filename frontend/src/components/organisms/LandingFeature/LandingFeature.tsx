import type { ReactNode } from 'react';
import styles from './LandingFeature.module.css';
export function LandingFeature({
  id,
  title,
  accent,
  description,
  image,
  width,
  height,
  reverse,
  children,
}: {
  id: string;
  title: string;
  accent: string;
  description: string;
  image: string;
  width: number;
  height: number;
  reverse?: boolean;
  children?: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`${styles.section} ${reverse ? styles.reverse : ''}`}
      aria-labelledby={`${id}-title`}
    >
      <div className={styles.copy}>
        <h2 id={`${id}-title`}>
          {title}
          <span>{accent}</span>
        </h2>
        <p>{description}</p>
        {children}
      </div>
      <img
        className={styles.image}
        src={image}
        width={width}
        height={height}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </section>
  );
}
