import type { ReactNode } from 'react';
import styles from './PageFrame.module.css';

type Props = { children: ReactNode; navigation?: ReactNode };

// Foundation shell, not the final Figma cabinet/auth template.
export function PageFrame({ children, navigation }: Props) {
  return (
    <div className={styles.frame}>
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="repeat.ai — главная">
          repeat.ai<span aria-hidden="true">.</span>
        </a>
        {navigation && <nav aria-label="Основная навигация">{navigation}</nav>}
      </header>
      <main id="main" tabIndex={-1} className={styles.main}>
        {children}
      </main>
      <footer className={styles.footer}>Знания. Развитие. Твои результаты.</footer>
    </div>
  );
}
