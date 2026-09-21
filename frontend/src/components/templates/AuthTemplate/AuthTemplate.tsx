import type { ReactNode } from 'react';
import logo from '@/assets/screens/logo.png';
import decor from '@/assets/screens/decor.png';
import { Icon } from '@/components/quarks/Icon';
import styles from './AuthTemplate.module.css';

type Props = {
  title: string;
  description: string;
  illustration: string;
  reassurance?: string;
  children: ReactNode;
  onboarding?: boolean;
};
export function AuthTemplate({
  title,
  description,
  illustration,
  reassurance,
  children,
  onboarding = false,
}: Props) {
  return (
    <div className={`${styles.layout} ${onboarding ? styles.onboarding : ''}`}>
      <aside className={styles.hero} aria-label="О сервисе">
        <a href="/" className={styles.logo} aria-label="Репит.центр — главная">
          <img src={logo} alt="Репит.центр" width="260" height="87" />
        </a>
        <div className={styles.explanation}>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <picture className={styles.illustration}>
          <source
            media="(max-width: 63.99rem)"
            srcSet="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
          />
          <img src={illustration} alt="" width="600" height="600" />
        </picture>
        {reassurance && (
          <p className={styles.reassurance}>
            <Icon name="brain" size={32} />
            {reassurance}
          </p>
        )}
      </aside>
      <main id="main" tabIndex={-1} className={styles.content}>
        {!onboarding && (
          <>
            <div className={styles.decor} aria-hidden="true">
              {['corner', 'leftGlow', 'bottomGlow'].map((part) => (
                <span key={part} className={styles[part]}>
                  <picture>
                    <source
                      media="(max-width: 63.99rem)"
                      srcSet="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                    />
                    <img src={decor} alt="" width="2048" height="1536" />
                  </picture>
                </span>
              ))}
            </div>
            <p className={styles.tagline}>Знания. Развитие. Твои результаты.</p>
          </>
        )}
        <div className={styles.card}>{children}</div>
      </main>
    </div>
  );
}
