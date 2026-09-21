import { useRef, useState } from 'react';
import { Link, useParams, useSearchParams, type MetaFunction } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/atoms/Button';
import { StatusPanel } from '@/components/molecules/StatusPanel';
import { LearningContent } from '@/components/organisms/LearningContent';
import {
  useKnowledge,
  rateKnowledge,
  knowledgeKey,
  type KnowledgeEntry,
  type Knowledge,
} from '@/features/knowledge';
import { useSessionActions } from '@/features/auth';
import { ApiError } from '@/shared/api/errors';
import { safeSourceUrl } from '@/shared/lib/content';
import { Workspace } from '../workspace/Workspace';
import styles from '../study/Study.module.css';
export const meta: MetaFunction = () => [
  { title: 'База знаний — repeat.ai' },
  { name: 'robots', content: 'noindex, nofollow' },
];
export default function KnowledgePage() {
  const { id = '' } = useParams(),
    query = useKnowledge(id),
    [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '',
    kind = params.get('kind') ?? 'all',
    topic = params.get('topic') ?? '',
    rating = params.get('rating') ?? 'all',
    selected = query.data?.entries.find((e) => e.id === params.get('entry'));
  const list =
    query.data?.entries.filter(
      (e) =>
        (kind === 'all' || e.kind === kind) &&
        (!topic || e.topicId === topic) &&
        (rating === 'all' || e.rating === rating) &&
        `${e.title} ${e.topicTitle}`
          .toLocaleLowerCase('ru')
          .includes(search.toLocaleLowerCase('ru').trim()),
    ) ?? [];
  function change(name: string, value: string) {
    setParams(
      (p) => {
        p.set(name, value);
        p.delete('entry');
        return p;
      },
      { replace: true },
    );
  }
  function open(entry: string | null) {
    setParams((p) => {
      if (entry) p.set('entry', entry);
      else p.delete('entry');
      return p;
    });
  }
  return (
    <Workspace
      title="База знаний"
      active="knowledge"
      description={query.data?.title ?? 'Знания вашего курса'}
    >
      <div className={styles.stack}>
        <nav className={styles.toolbar} aria-label="Разделы базы знаний">
          <Link to={`/app/tracks/${id}`}>К карте курса</Link>
          <Link to="/app/knowledge">Все курсы</Link>
        </nav>
        {query.isError ? (
          <StatusPanel
            state="error"
            title="База знаний недоступна"
            description={query.error.message}
            onRetry={() => void query.refetch()}
          />
        ) : !query.data ? (
          <StatusPanel
            state="loading"
            title="Загружаем базу знаний"
            description="Получаем вопросы и источники."
          />
        ) : (
          <>
            <section className={styles.panel}>
              <h2>{query.data.title}</h2>
              <p>
                Версия программы {query.data.planVersion} · Вопросов:{' '}
                {query.data.entries.filter((e) => e.kind === 'question').length} · Знаю:{' '}
                {
                  query.data.entries.filter((e) => e.kind === 'question' && e.rating === 'known')
                    .length
                }
              </p>
              <p>Самооценка знаний хранится отдельно от прогресса и экзаменов.</p>
            </section>
            {!selected ? (
              <>
                <div className={styles.toolbar}>
                  <label>
                    Поиск в базе знаний
                    <input value={search} onChange={(e) => change('q', e.target.value)} />
                  </label>
                  <label>
                    Раздел
                    <select
                      aria-label="Раздел"
                      value={kind}
                      onChange={(e) => change('kind', e.target.value)}
                    >
                      <option value="all">Обзор</option>
                      <option value="question">Вопросы</option>
                      <option value="term">Термины</option>
                      <option value="source">Источники</option>
                    </select>
                  </label>
                  <label>
                    Самооценка
                    <select
                      aria-label="Самооценка"
                      value={rating}
                      onChange={(e) => change('rating', e.target.value)}
                    >
                      <option value="all">Все</option>
                      <option value="unseen">Не проверял</option>
                      <option value="repeat">Повторить</option>
                      <option value="known">Знаю</option>
                    </select>
                  </label>
                  {topic && (
                    <Button variant="outline" onClick={() => change('topic', '')}>
                      Все темы
                    </Button>
                  )}
                </div>
                {params.has('entry') && <p role="status">Запись не найдена. Выберите другую.</p>}
                <div className={styles.cards}>
                  {list.map((e) => (
                    <article key={e.id} className={styles.panel}>
                      <small>{e.topicTitle}</small>
                      <h2>{e.title}</h2>
                      <p>
                        {e.kind === 'question'
                          ? e.rating === 'known'
                            ? 'Знаю'
                            : e.rating === 'repeat'
                              ? 'Повторить'
                              : 'Не проверял'
                          : e.kind === 'source'
                            ? 'Источник'
                            : 'Термин'}
                      </p>
                      <Button variant="outline" onClick={() => open(e.id)}>
                        Открыть запись
                      </Button>
                    </article>
                  ))}
                </div>
                {!list.length && (
                  <section className={styles.panel}>
                    <h2>Записи не найдены</h2>
                    <p>
                      Измените фильтры. Проверенные источники и термины появятся после наполнения
                      базы знаний.
                    </p>
                    <Button variant="outline" onClick={() => setParams({})}>
                      Сбросить фильтры
                    </Button>
                  </section>
                )}
              </>
            ) : (
              <KnowledgeDetail
                key={selected.id}
                entry={selected}
                trackId={id}
                onBack={() => open(null)}
                onNext={() => {
                  const index = list.findIndex((e) => e.id === selected.id);
                  open(list[index + 1]?.id ?? null);
                }}
              />
            )}
          </>
        )}
      </div>
    </Workspace>
  );
}
function KnowledgeDetail({
  entry,
  trackId,
  onBack,
  onNext,
}: {
  entry: KnowledgeEntry;
  trackId: string;
  onBack: () => void;
  onNext: () => void;
}) {
  const [revealed, setRevealed] = useState(entry.kind !== 'question'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [conflict, setConflict] = useState(false);
  const client = useQueryClient(),
    { forget } = useSessionActions(),
    lock = useRef(false),
    pending = useRef<{ signature: string; key: string } | null>(null);
  async function rate(rating: 'known' | 'repeat') {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    const signature = JSON.stringify([entry.id, entry.version, rating]);
    if (pending.current?.signature !== signature)
      pending.current = { signature, key: crypto.randomUUID() };
    try {
      const next = await rateKnowledge(
        trackId,
        entry.id,
        rating,
        entry.version,
        pending.current.key,
      );
      client.setQueryData<Knowledge>(knowledgeKey(trackId), (old) =>
        old ? { ...old, entries: old.entries.map((e) => (e.id === next.id ? next : e)) } : old,
      );
      pending.current = null;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) await forget();
      else {
        setError(e instanceof Error ? e.message : 'Не удалось сохранить самооценку.');
        setConflict(e instanceof ApiError && e.status === 409);
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section className={styles.panel}>
      <div className={styles.stack}>
        <Button variant="outline" disabled={busy} onClick={onBack}>
          К списку записей
        </Button>
        <small>{entry.topicTitle}</small>
        <h2>{entry.title}</h2>
        {entry.kind === 'question' && !revealed && (
          <>
            <p>Сначала сформулируйте свой ответ, затем сравните его с пояснением.</p>
            <Button onClick={() => setRevealed(true)}>Показать ответ</Button>
          </>
        )}
        {revealed && (
          <>
            <LearningContent blocks={entry.blocks} />
            {entry.url &&
              (safeSourceUrl(entry.url) && entry.verificationStatus !== 'broken' ? (
                <a href={safeSourceUrl(entry.url)!} target="_blank" rel="noopener noreferrer">
                  Открыть источник в новой вкладке
                </a>
              ) : (
                <p>Ссылка недоступна.</p>
              ))}
            {entry.kind === 'source' && (
              <p>
                {entry.verificationStatus === 'verified'
                  ? 'Проверен'
                  : 'Источник не проверен или недоступен'}
              </p>
            )}
            {entry.kind === 'question' && (
              <>
                <p role="status">
                  Моя отметка:{' '}
                  {entry.rating === 'known'
                    ? 'Знаю'
                    : entry.rating === 'repeat'
                      ? 'Повторить'
                      : 'Не проверял'}
                </p>
                <div className={styles.actions}>
                  <Button disabled={busy || conflict} onClick={() => void rate('repeat')}>
                    Нужно повторить
                  </Button>
                  <Button disabled={busy || conflict} onClick={() => void rate('known')}>
                    Знаю
                  </Button>
                </div>
              </>
            )}
          </>
        )}
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        {conflict && (
          <Button
            onClick={async () => {
              await client.invalidateQueries({ queryKey: knowledgeKey(trackId) });
              setConflict(false);
              setError('');
              pending.current = null;
            }}
          >
            Обновить базу знаний
          </Button>
        )}
        <Button variant="outline" disabled={busy} onClick={onNext}>
          Следующая запись
        </Button>
      </div>
    </section>
  );
}
