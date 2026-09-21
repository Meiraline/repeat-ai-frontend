import { Link, type MetaFunction } from 'react-router';
import { useDashboard } from '@/features/courses';
import { StatusPanel } from '@/components/molecules/StatusPanel';
import { Workspace } from '../workspace/Workspace';
import styles from '../study/Study.module.css';
export const meta: MetaFunction = () => [
  { title: 'Дипломы — repeat.ai' },
  { name: 'robots', content: 'noindex, nofollow' },
];
export default function DiplomaIndex() {
  const query = useDashboard();
  return (
    <Workspace title="Мои дипломы" active="diplomas" description="Доступ к выпуску по вашим курсам">
      {query.isError ? (
        <StatusPanel
          state="error"
          title="Курсы недоступны"
          description={query.error.message}
          onRetry={() => void query.refetch()}
        />
      ) : !query.data ? (
        <StatusPanel state="loading" title="Загружаем курсы" description="Получаем список." />
      ) : (
        <div className={styles.cards}>
          {query.data.tracks.map((t) => (
            <article className={styles.panel} key={t.id}>
              <h2>{t.title}</h2>
              <Link to={`/app/tracks/${t.id}/diploma`}>Открыть статус диплома</Link>
            </article>
          ))}
          {!query.data.tracks.length && (
            <section className={styles.panel}>
              <h2>Пока нет курсов</h2>
              <p>Выпуск станет доступен после завершения учебной программы.</p>
              <Link to="/app">Мои курсы</Link>
            </section>
          )}
        </div>
      )}
    </Workspace>
  );
}
