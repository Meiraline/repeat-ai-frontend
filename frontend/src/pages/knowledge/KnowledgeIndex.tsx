import { Link, useSearchParams, type MetaFunction } from 'react-router';
import { useDashboard } from '@/features/courses';
import { StatusPanel } from '@/components/molecules/StatusPanel';
import { Workspace } from '../workspace/Workspace';
import styles from '../study/Study.module.css';
export const meta: MetaFunction = () => [
  { title: 'Базы знаний курсов — repeat.ai' },
  { name: 'robots', content: 'noindex, nofollow' },
];
export default function KnowledgeIndex() {
  const query = useDashboard(),
    [params, setParams] = useSearchParams(),
    search = params.get('q') ?? '';
  return (
    <Workspace title="База знаний" active="knowledge" description="Выберите учебный курс">
      <div className={styles.stack}>
        <div className={styles.toolbar}>
          <label>
            Найти курс
            <input
              value={search}
              onChange={(e) => setParams({ q: e.target.value }, { replace: true })}
            />
          </label>
        </div>
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
          <>
            <div className={styles.cards}>
              {query.data.tracks
                .filter((t) =>
                  t.title.toLocaleLowerCase('ru').includes(search.toLocaleLowerCase('ru').trim()),
                )
                .map((t) => (
                  <article className={styles.panel} key={t.id}>
                    <h2>{t.title}</h2>
                    <Link to={`/app/tracks/${t.id}/knowledge`}>Открыть базу знаний курса</Link>
                  </article>
                ))}
            </div>
            {!query.data.tracks.some((t) =>
              t.title.toLocaleLowerCase('ru').includes(search.toLocaleLowerCase('ru').trim()),
            ) && (
              <section className={styles.panel}>
                <h2>Курсы не найдены</h2>
                <p>База знаний появится после утверждения программы.</p>
                <Link to="/app">Мои курсы</Link>
              </section>
            )}
          </>
        )}
      </div>
    </Workspace>
  );
}
