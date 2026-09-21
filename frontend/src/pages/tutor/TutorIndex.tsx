import { Link, type MetaFunction } from 'react-router';
import { useDashboard } from '@/features/courses';
import { StatusPanel } from '@/components/molecules/StatusPanel';
import { Workspace } from '../workspace/Workspace';
import styles from '../study/Study.module.css';
export const meta: MetaFunction = () => [
  { title: 'Выбрать курс для репетитора — repeat.ai' },
  { name: 'robots', content: 'noindex, nofollow' },
];
export default function TutorIndex() {
  const query = useDashboard();
  return (
    <Workspace title="AI-репетитор" active="tutor" description="Выберите курс для диалога">
      {query.isError ? (
        <StatusPanel
          state="error"
          title="Курсы недоступны"
          description={query.error.message}
          onRetry={() => void query.refetch()}
        />
      ) : !query.data ? (
        <StatusPanel
          state="loading"
          title="Загружаем курсы"
          description="Получаем ваши программы."
        />
      ) : (
        <div className={styles.cards}>
          {query.data.tracks.map((t) => (
            <article className={styles.panel} key={t.id}>
              <h2>{t.title}</h2>
              <Link to={`/app/tracks/${t.id}/tutor`}>Обсудить курс</Link>
            </article>
          ))}
          {!query.data.tracks.length && (
            <section className={styles.panel}>
              <h2>Сначала создайте курс</h2>
              <p>Репетитор станет доступен после утверждения программы.</p>
              <Link to="/app/plans/new">Создать курс</Link>
            </section>
          )}
        </div>
      )}
    </Workspace>
  );
}
