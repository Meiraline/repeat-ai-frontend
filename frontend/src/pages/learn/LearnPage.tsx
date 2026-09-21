import { useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams, type MetaFunction } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/atoms/Button';
import { Checkbox } from '@/components/atoms/Checkbox';
import { ProgressBar } from '@/components/atoms/ProgressBar';
import { Dialog } from '@/components/molecules/Dialog';
import { StatusPanel } from '@/components/molecules/StatusPanel';
import { RoadmapTopic } from '@/components/molecules/RoadmapTopic';
import { LearningContent } from '@/components/organisms/LearningContent';
import {
  useLearningTrack,
  useLesson,
  completeMaterial,
  lessonKey,
  trackKey,
  statusLabel,
  type Lesson,
} from '@/features/learning';
import { useSessionActions } from '@/features/auth';
import { ApiError } from '@/shared/api/errors';
import { safeSourceUrl } from '@/shared/lib/content';
import { Workspace } from '../workspace/Workspace';
import styles from '../study/Study.module.css';
export const meta: MetaFunction = () => [
  { title: 'Обучение — repeat.ai' },
  { name: 'robots', content: 'noindex, nofollow' },
];
export default function LearnPage() {
  const { id = '', topic = '' } = useParams(),
    query = useLearningTrack(id),
    navigate = useNavigate();
  const [params, setParams] = useSearchParams(),
    [locked, setLocked] = useState<string | null>(null);
  const search = params.get('q') ?? '',
    list = params.get('view') === 'list';
  const data = query.data;
  return (
    <Workspace
      title={data?.title ?? 'Учебная программа'}
      description="Карта тем и учебные материалы"
    >
      <div className={styles.stack}>
        <nav className={styles.toolbar} aria-label="Разделы обучения">
          <Link to="/app">Мои курсы</Link>
          <Link to={`/app/tracks/${id}`}>Карта курса</Link>
          <Link to={`/app/tracks/${id}/knowledge`}>База знаний курса</Link>
          <Link to={`/app/tracks/${id}/project`}>Итоговый проект</Link>
          <Link to={`/app/tracks/${id}/tutor${topic ? `?topic=${encodeURIComponent(topic)}` : ''}`}>
            Спросить репетитора
          </Link>
        </nav>
        {query.isError ? (
          <StatusPanel
            state="error"
            title="Не удалось загрузить программу"
            description={query.error.message}
            onRetry={() => void query.refetch()}
          />
        ) : !data ? (
          <StatusPanel
            state="loading"
            title="Загружаем программу"
            description="Получаем доступные темы."
          />
        ) : (
          <>
            <section className={styles.panel}>
              <h2>{data.title}</h2>
              <p>
                Версия программы {data.planVersion} · Изучено материалов: {data.progressPercent}%
              </p>
              <ProgressBar value={data.progressPercent} label="Изучено материалов курса" />
              <Link to={`/app/plans/${data.planId}/review`}>Утверждённая программа</Link>
            </section>
            {topic ? (
              <LessonPanel key={`${id}/${topic}`} id={id} topic={topic} />
            ) : (
              <>
                <div className={styles.toolbar}>
                  <Button
                    variant={!list ? 'primary' : 'outline'}
                    aria-pressed={!list}
                    onClick={() =>
                      setParams((p) => {
                        p.set('view', 'map');
                        return p;
                      })
                    }
                  >
                    Карта
                  </Button>
                  <Button
                    variant={list ? 'primary' : 'outline'}
                    aria-pressed={list}
                    onClick={() =>
                      setParams((p) => {
                        p.set('view', 'list');
                        return p;
                      })
                    }
                  >
                    Список
                  </Button>
                  <label>
                    Найти тему
                    <input
                      value={search}
                      onChange={(e) =>
                        setParams(
                          (p) => {
                            p.set('q', e.target.value);
                            return p;
                          },
                          { replace: true },
                        )
                      }
                    />
                  </label>
                </div>
                {data.modules.map((module) => (
                  <section key={module.id} className={styles.panel}>
                    <h2>{module.title}</h2>
                    <ol className={`${styles.roadmap} ${!list ? styles.map : ''}`}>
                      {module.topics
                        .filter((t) =>
                          t.title
                            .toLocaleLowerCase('ru')
                            .includes(search.toLocaleLowerCase('ru').trim()),
                        )
                        .map((t) => (
                          <RoadmapTopic
                            key={t.id}
                            title={t.title}
                            status={statusLabel[t.status]}
                            progress={t.progressPercent}
                            reason={t.lockReason}
                            selected={t.id === data.currentTopicId}
                            onOpen={() =>
                              t.status === 'locked'
                                ? setLocked(t.lockReason ?? 'Тема пока закрыта.')
                                : void navigate(`/app/tracks/${id}/topics/${t.id}`)
                            }
                          />
                        ))}
                    </ol>
                    {!module.topics.some((t) =>
                      t.title
                        .toLocaleLowerCase('ru')
                        .includes(search.toLocaleLowerCase('ru').trim()),
                    ) && <p>Темы не найдены. Измените запрос.</p>}
                  </section>
                ))}
              </>
            )}
          </>
        )}
      </div>
      <Dialog open={!!locked} title="Тема пока закрыта" onClose={() => setLocked(null)}>
        <p>{locked}</p>
        <p>
          Самопроверка не заменяет контрольную точку. Следующая тема откроется после успешного
          результата экзамена по предыдущей теме.
        </p>
        <Button onClick={() => setLocked(null)}>Понятно</Button>
      </Dialog>
    </Workspace>
  );
}
function LessonPanel({ id, topic }: { id: string; topic: string }) {
  const query = useLesson(id, topic),
    client = useQueryClient(),
    { forget } = useSessionActions();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [conflict, setConflict] = useState(false),
    [confirmation, setConfirmation] = useState<Lesson['materials'][number] | null>(null);
  const lock = useRef(false),
    pending = useRef<{ signature: string; key: string } | null>(null);
  async function save(material: Lesson['materials'][number], completed: boolean) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setConflict(false);
    const signature = JSON.stringify([material.id, completed, material.version]);
    if (pending.current?.signature !== signature)
      pending.current = { signature, key: crypto.randomUUID() };
    try {
      const next = await completeMaterial(
        id,
        topic,
        material.id,
        completed,
        material.version,
        pending.current.key,
      );
      client.setQueryData(lessonKey(id, topic), next);
      pending.current = null;
      setConfirmation(null);
      await Promise.all([
        client.invalidateQueries({ queryKey: trackKey(id) }),
        client.invalidateQueries({ queryKey: ['session', 'dashboard'] }),
      ]);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) await forget();
      else if (e instanceof ApiError && e.status === 403) await query.refetch();
      else {
        setError(e instanceof Error ? e.message : 'Не удалось сохранить прогресс.');
        setConflict(e instanceof ApiError && e.status === 409);
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const feedback = (
    <>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {conflict && (
        <Button
          variant="outline"
          disabled={busy}
          onClick={async () => {
            const result = await query.refetch();
            if (!result.error) {
              setError('');
              setConflict(false);
              setConfirmation(null);
              pending.current = null;
            }
          }}
        >
          Загрузить сохранённый прогресс
        </Button>
      )}
    </>
  );
  if (query.isError || !query.data)
    return (
      <StatusPanel
        state={query.isError ? 'error' : 'loading'}
        title={
          query.error instanceof ApiError && query.error.status === 403
            ? 'Тема пока закрыта'
            : query.isError
              ? 'Тема недоступна'
              : 'Загружаем урок'
        }
        description={query.error?.message ?? 'Получаем материалы.'}
        onRetry={query.isError ? () => void query.refetch() : undefined}
      />
    );
  const lesson = query.data;
  return (
    <>
      <div className={styles.columns}>
        <div className={styles.stack}>
          <section className={styles.panel}>
            <h2>{lesson.topic.title}</h2>
            <p>
              {statusLabel[lesson.topic.status]} · {lesson.topic.progressPercent}%
            </p>
            <ProgressBar value={lesson.topic.progressPercent} label="Прогресс темы" />
            <h3>Об уроке</h3>
            <p>{lesson.topic.outcome}</p>
          </section>
          <section className={styles.panel}>
            <h2>Материалы</h2>
            {!confirmation && feedback}
            <div className={styles.stack}>
              {lesson.materials.map((m) => (
                <article key={m.id} className={styles.material}>
                  <details>
                    <summary>{m.title}</summary>
                    <small>
                      {m.type} ·{' '}
                      {m.verificationStatus === 'verified'
                        ? 'Источник проверен'
                        : m.verificationStatus === 'broken'
                          ? 'Источник недоступен'
                          : 'Источник не проверен'}
                    </small>
                    <LearningContent blocks={m.blocks} />
                    {m.url &&
                      (safeSourceUrl(m.url) && m.verificationStatus !== 'broken' ? (
                        <a href={safeSourceUrl(m.url)!} target="_blank" rel="noopener noreferrer">
                          Открыть источник в новой вкладке
                        </a>
                      ) : (
                        <p>Ссылка недоступна.</p>
                      ))}
                  </details>
                  <label className={styles.check}>
                    <Checkbox
                      checked={m.completed}
                      disabled={busy || conflict}
                      onChange={(e) =>
                        e.target.checked && m.verificationStatus !== 'verified'
                          ? setConfirmation(m)
                          : void save(m, e.target.checked)
                      }
                    />
                    Изучено: {m.title}
                  </label>
                </article>
              ))}
            </div>
            {!lesson.materials.length && (
              <p>Материалы пока не опубликованы. Прогресс не изменён.</p>
            )}
          </section>
          <section className={styles.panel}>
            <h2>Контрольные вопросы</h2>
            <p>Самопроверка помогает повторить тему и не влияет на результат экзамена.</p>
            <Link
              to={`/app/tracks/${id}/knowledge?kind=question&topic=${encodeURIComponent(topic)}`}
            >
              Начать самопроверку
            </Link>
          </section>
        </div>
        <aside className={styles.panel}>
          <h2>Навигация по уроку</h2>
          <p>{lesson.topic.title}</p>
          <p>
            {lesson.examAccess.allowed
              ? 'Материалы изучены. Контрольная точка доступна.'
              : lesson.examAccess.reason}
          </p>
          <div className={styles.stack}>
            <Link to={`/app/tracks/${id}/exam/${topic}`}>Открыть экзамен</Link>
            <Link to={`/app/tracks/${id}`}>Вернуться к карте курса</Link>
            <Link to={`/app/tracks/${id}/knowledge`}>Открыть базу знаний</Link>
          </div>
        </aside>
      </div>
      <Dialog
        wide
        open={!!confirmation}
        title="Подтвердить изучение"
        onClose={() => {
          if (!busy) setConfirmation(null);
        }}
      >
        <p>
          У материала «{confirmation?.title}» нет проверенного источника. Отметка сохранит вашу
          самооценку, но не подтвердит качество материала и не засчитает экзамен.
        </p>
        {feedback}
        <div className={styles.actions}>
          <Button variant="outline" disabled={busy} onClick={() => setConfirmation(null)}>
            Отмена
          </Button>
          <Button
            loading={busy}
            disabled={conflict}
            onClick={() => confirmation && void save(confirmation, true)}
          >
            Подтвердить изучение
          </Button>
        </div>
      </Dialog>
    </>
  );
}
