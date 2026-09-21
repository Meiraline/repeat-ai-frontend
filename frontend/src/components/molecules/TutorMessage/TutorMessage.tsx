import type { ReactNode } from 'react';
import portrait from '@/assets/mentors/lira-tutor.png';
import { safeSourceUrl } from '@/shared/lib/content';
import styles from './TutorMessage.module.css';
export function TutorMessage({
  role,
  partial,
  version,
  sources,
  children,
}: {
  role: 'user' | 'assistant';
  partial: boolean;
  version: number;
  sources: { title: string; url: string }[];
  children: ReactNode;
}) {
  return (
    <article
      className={`${styles.message} ${role === 'user' ? styles.user : ''}`}
      aria-label={role === 'user' ? 'Ваше сообщение' : 'Ответ репетитора'}
    >
      <header>
        {role === 'assistant' && <img src={portrait} width={32} height={32} alt="" />}
        <strong>{role === 'user' ? 'Вы' : 'Лира'}</strong>
        <small>Контекст v{version}</small>
      </header>
      {children}
      {partial && <p role="status">Ответ получен частично. Его можно восстановить.</p>}
      {role === 'assistant' && (
        <footer>
          {sources.length ? (
            <>
              <span>Источники · {sources.length}</span>
              <ul>
                {sources.map((s, i) => {
                  const url = safeSourceUrl(s.url);
                  return (
                    <li key={i}>
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          {s.title}
                        </a>
                      ) : (
                        <span>{s.title} — ссылка недоступна</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            'Источники не использовались.'
          )}
        </footer>
      )}
    </article>
  );
}
