import styles from './PlanReviewProgram.module.css';
type Topic = {
  id: string;
  title: string;
  description: string;
  sources: { title: string; url: string; verified: boolean }[];
};
export function PlanReviewProgram({
  title,
  goal,
  topics,
}: {
  title: string;
  goal: string;
  topics: Topic[];
}) {
  return (
    <section className={styles.program} aria-label="Темы программы">
      <h2>{title}</h2>
      <p>{goal}</p>
      <ol>
        {topics.map((topic, i) => (
          <li key={topic.id} className={styles.topic}>
            <small>
              {String(i + 1).padStart(2, '0')} ·{' '}
              {topic.sources.some((s) => s.verified) ? 'Источник проверен' : 'Нужен источник'}
            </small>
            <h3>{topic.title}</h3>
            <p>{topic.description}</p>
            <details>
              <summary>Источники и материалы</summary>
              {topic.sources.length ? (
                <ul>
                  {topic.sources.map((s) => (
                    <li key={s.url}>
                      <a
                        href={/^https?:\/\//.test(s.url) ? s.url : undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {s.title}
                      </a>{' '}
                      · {s.verified ? 'Проверен' : 'Не проверен'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>
                  Проверенный источник пока не найден. Тема останется в программе с этим
                  ограничением.
                </p>
              )}
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}
