import { useEffect, useRef, useState } from 'react';
import {
  Link,
  useParams,
  useSearchParams,
  useBlocker,
  useBeforeUnload,
  type MetaFunction,
} from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/atoms/Button';
import { StatusPanel } from '@/components/molecules/StatusPanel';
import { Dialog } from '@/components/molecules/Dialog';
import { TutorMessage } from '@/components/molecules/TutorMessage';
import { LearningContent } from '@/components/organisms/LearningContent';
import { useLearningTrack, trackKey } from '@/features/learning';
import { useSessionActions } from '@/features/auth';
import {
  useTutor,
  tutorKey,
  createTutorThread,
  sendTutorMessage,
  refreshTutorContext,
  type TutorData,
  type TutorThread,
  useMentorPreferences,
  type MentorPreferences,
} from '@/features/tutor';
import { ApiError } from '@/shared/api/errors';
import { mentorCatalog } from '@/assets/mentors/catalog';
import { Workspace } from '../workspace/Workspace';
import styles from './TutorPage.module.css';
export const meta: MetaFunction = () => [
  { title: 'AI-репетитор — repeat.ai' },
  { name: 'robots', content: 'noindex, nofollow' },
];
export default function TutorPage() {
  const { id = '' } = useParams(),
    track = useLearningTrack(id);
  return (
    <Workspace title="AI-репетитор" active="tutor" description="Диалог в контексте вашего курса">
      {track.isError ? (
        <StatusPanel
          state="error"
          title="Курс недоступен"
          description={track.error.message}
          onRetry={() => void track.refetch()}
        />
      ) : !track.data ? (
        <StatusPanel
          state="loading"
          title="Загружаем курс"
          description="Получаем контекст диалога."
        />
      ) : (
        <TutorCourse key={id} id={id} version={track.data.planVersion} />
      )}
    </Workspace>
  );
}
function TutorCourse({ id, version }: { id: string; version: number }) {
  const { preferences } = useMentorPreferences();
  const mentor = mentorCatalog[preferences.persona];
  const query = useTutor(id, version),
    client = useQueryClient(),
    { forget } = useSessionActions(),
    [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(''),
    [topic, setTopic] = useState(params.get('topic') ?? ''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const lock = useRef(false),
    createKey = useRef<{ signature: string; key: string } | null>(null);
  const selected = params.get('thread'),
    data = query.data,
    thread = selected ? data?.threads.find((t) => t.id === selected) : data?.threads[0];
  function update(thread: TutorThread) {
    client.setQueryData<TutorData>(tutorKey(id, version), (old) =>
      old
        ? {
            ...old,
            threads: old.threads.some((t) => t.id === thread.id)
              ? old.threads.map((t) => (t.id === thread.id ? thread : t))
              : [thread, ...old.threads],
          }
        : old,
    );
  }
  async function reload() {
    await client.invalidateQueries({ queryKey: trackKey(id) });
    await query.refetch();
  }
  async function create() {
    if (!data || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    const signature = JSON.stringify([topic, data.contextVersion]);
    if (createKey.current?.signature !== signature)
      createKey.current = { signature, key: crypto.randomUUID() };
    try {
      const result = await createTutorThread(
        id,
        topic || null,
        data.contextVersion,
        createKey.current.key,
      );
      update(result);
      createKey.current = null;
      setParams({ thread: result.id });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) await forget();
      else {
        setError(e instanceof Error ? e.message : 'Не удалось создать диалог.');
        await reload();
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (query.isError)
    return (
      <StatusPanel
        state="error"
        title="Диалоги недоступны"
        description={query.error.message}
        onRetry={() => void query.refetch()}
      />
    );
  if (!data)
    return (
      <StatusPanel
        state="loading"
        title="Загружаем диалоги"
        description="Получаем историю и контекст."
      />
    );
  return (
    <div className={styles.page}>
      <section className={styles.context} aria-label="Контекст курса">
        <div>
          <small>Контекст диалога · программа v{data.contextVersion}</small>
          <p>
            {data.title}
            {thread ? ` / ${thread.title}` : ''}
          </p>
        </div>
        <Link
          to={thread?.topicId ? `/app/tracks/${id}/topics/${thread.topicId}` : `/app/tracks/${id}`}
        >
          Вернуться к обучению
        </Link>
      </section>
      <div className={styles.columns}>
        <aside className={styles.threads} aria-label="Диалоги курса">
          <h2>Диалоги</h2>
          <label>
            Поиск диалога
            <input value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <div className={styles.threadList}>
            {data.threads
              .filter((t) =>
                t.title.toLocaleLowerCase('ru').includes(search.toLocaleLowerCase('ru').trim()),
              )
              .map((t) => (
                <Link
                  key={t.id}
                  to={`?thread=${t.id}`}
                  aria-current={thread?.id === t.id ? 'page' : undefined}
                >
                  <strong>{t.title}</strong>
                  <small>
                    {t.messages.length} сообщений · v{t.contextVersion}
                  </small>
                </Link>
              ))}
          </div>
          {!data.threads.length && <p>Начните первый диалог.</p>}
          {data.threads.length > 0 &&
            !data.threads.some((t) =>
              t.title.toLocaleLowerCase('ru').includes(search.toLocaleLowerCase('ru').trim()),
            ) && <p>Диалоги не найдены.</p>}
          <label>
            Тема нового диалога
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              aria-label="Тема нового диалога"
            >
              <option value="">Весь курс</option>
              {data.topics.map((t) => (
                <option value={t.id} key={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
          <Button onClick={() => void create()} disabled={busy} loading={busy}>
            Новый диалог
          </Button>
          {error && <p role="alert">{error}</p>}
        </aside>
        {thread ? (
          <Conversation
            key={thread.id}
            id={id}
            thread={thread}
            currentVersion={data.contextVersion}
            update={update}
            reload={reload}
          />
        ) : (
          <section className={styles.empty}>
            <h2>{selected ? 'Диалог не найден' : 'С чего начнём?'}</h2>
            <p>
              Выберите тему и нажмите «Новый диалог». Репетитор поможет обсудить материал в
              контексте курса.
            </p>
            <p>Сейчас ответы демонстрационные — AI ещё не подключён.</p>
          </section>
        )}
        <aside className={styles.utility} aria-label="О репетиторе">
          <img src={mentor.image} alt={`${mentor.name} — AI-наставник`} width={240} height={260} />
          <h2>{mentor.name}</h2>
          <p>Выбран для новых сообщений</p>
          <Link to="/app/settings#mentor">Настроить наставника</Link>
          <details open>
            <summary>Контекст и источники</summary>
            <p>{data.title}</p>
            <p>{thread?.title ?? 'Выберите диалог'}</p>
            <p>
              Источники перечисляются под тем ответом, в котором использовались. Демонстрационные
              ответы не содержат проверенных источников.
            </p>
          </details>
        </aside>
      </div>
    </div>
  );
}
function Conversation({
  id,
  thread,
  currentVersion,
  update,
  reload,
}: {
  id: string;
  thread: TutorThread;
  currentVersion: number;
  update: (t: TutorThread) => void;
  reload: () => Promise<void>;
}) {
  const { preferences } = useMentorPreferences();
  const [text, setText] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [conflict, setConflict] = useState(false),
    [unread, setUnread] = useState(false);
  const { forget } = useSessionActions(),
    lock = useRef(false),
    pending = useRef<{
      text: string;
      key: string;
      version: number;
      preferences: MentorPreferences;
    } | null>(null),
    viewport = useRef<HTMLDivElement>(null),
    nearBottom = useRef(true);
  const stale = thread.contextVersion !== currentVersion;
  const partial = thread.messages.find(
    (m) =>
      m.role === 'assistant' &&
      m.status === 'partial' &&
      m.contextVersion === thread.contextVersion,
  );
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      (text.trim().length > 0 || busy) &&
      currentLocation.pathname + currentLocation.search !==
        nextLocation.pathname + nextLocation.search,
  );
  useBeforeUnload((event) => {
    if (text.trim() || busy) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
  useEffect(() => {
    const box = viewport.current;
    if (!box) return;
    if (nearBottom.current) box.scrollTop = box.scrollHeight;
    else setUnread(true);
  }, [thread.messages]);
  useEffect(() => {
    const box = viewport.current;
    if (!box) return;
    const observer = new ResizeObserver(() => {
      if (nearBottom.current) box.scrollTop = box.scrollHeight;
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);
  async function send(recover = false) {
    if (lock.current || stale || conflict) return;
    let message = text.trim(),
      key: string,
      version = thread.contextVersion,
      messagePreferences: MentorPreferences;
    if (recover && partial) {
      const user = thread.messages.find(
        (m) => m.role === 'user' && m.clientMessageId === partial.clientMessageId,
      );
      if (user?.blocks[0]?.type !== 'paragraph') return;
      message = user.blocks[0].text;
      key = user.clientMessageId;
      version = user.contextVersion;
      messagePreferences = user.preferences;
    } else {
      if (!message || message.length > 8000) return;
      if (pending.current?.text !== message || pending.current?.version !== version)
        pending.current = { text: message, key: crypto.randomUUID(), version, preferences };
      key = pending.current.key;
      messagePreferences = pending.current.preferences;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await sendTutorMessage(
        id,
        thread.id,
        message,
        version,
        key,
        messagePreferences,
      );
      update(result);
      pending.current = null;
      if (!recover) setText('');
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) await forget();
      else {
        setError(e instanceof Error ? e.message : 'Не удалось получить ответ.');
        setConflict(e instanceof ApiError && (e.status === 409 || e.status === 403));
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function refreshContext() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      update(await refreshTutorContext(id, thread.id, thread.contextVersion, currentVersion));
      pending.current = null;
      setConflict(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) await forget();
      else setError(e instanceof Error ? e.message : 'Контекст недоступен.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section className={styles.chat} aria-label="Чат с репетитором">
      <header>
        <h2>{thread.title}</h2>
        <small>Диалог · контекст v{thread.contextVersion}</small>
      </header>
      <div
        className={styles.messages}
        ref={viewport}
        role="region"
        aria-label="История сообщений"
        tabIndex={0}
        onScroll={() => {
          const box = viewport.current!;
          nearBottom.current = box.scrollHeight - box.scrollTop - box.clientHeight < 48;
          setUnread(!nearBottom.current);
        }}
      >
        {!thread.messages.length && (
          <p>
            Задайте вопрос о теме, задании или результате. Enter добавляет новую строку; отправка —
            кнопкой.
          </p>
        )}
        {thread.messages.map((m) => (
          <TutorMessage
            key={m.id}
            role={m.role}
            partial={m.status === 'partial'}
            version={m.contextVersion}
            sources={m.sources}
            mentorName={mentorCatalog[m.preferences.persona].name}
            mentorImage={mentorCatalog[m.preferences.persona].image}
          >
            <LearningContent blocks={m.blocks} />
          </TutorMessage>
        ))}
      </div>
      {unread && (
        <Button
          variant="outline"
          onClick={() => {
            const box = viewport.current!;
            box.scrollTop = box.scrollHeight;
            nearBottom.current = true;
            setUnread(false);
          }}
        >
          К последнему сообщению
        </Button>
      )}
      <div className={styles.composer}>
        <p role="status">
          {busy
            ? 'Ожидаем ответ…'
            : partial
              ? 'Получен неполный ответ.'
              : 'Ответы в этом режиме демонстрационные.'}
        </p>
        {(stale || conflict) && (
          <div role="alert">
            <p>
              {stale
                ? `Контекст изменился: v${thread.contextVersion} → v${currentVersion}. Подтвердите новую версию перед отправкой. История сохранится.`
                : 'Проверьте актуальность контекста. Текст сообщения сохранён.'}
            </p>
            {stale ? (
              <Button disabled={busy} onClick={() => void refreshContext()}>
                Подтвердить новый контекст
              </Button>
            ) : (
              <Button disabled={busy} onClick={() => void reload().then(() => setConflict(false))}>
                Обновить контекст
              </Button>
            )}
          </div>
        )}
        {error && <p role="alert">{error}</p>}
        {partial && !stale && (
          <Button disabled={busy || conflict} onClick={() => void send(true)}>
            Восстановить ответ
          </Button>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <label htmlFor="tutor-message">Ваше сообщение</label>
          <small id="tutor-scope">
            Для этого сообщения: {thread.title} · v{thread.contextVersion}
          </small>
          <textarea
            id="tutor-message"
            aria-describedby="tutor-scope tutor-length"
            value={text}
            maxLength={8000}
            rows={3}
            readOnly={busy}
            onChange={(e) => setText(e.target.value)}
            placeholder="Спросите о теме, задании или результате…"
          />
          <div className={styles.send}>
            <small id="tutor-length">{text.length} / 8000</small>
            <Button
              type="submit"
              disabled={!text.trim() || busy || stale || conflict || !!partial}
              loading={busy}
            >
              {error && !conflict ? 'Повторить отправку' : 'Отправить'}
            </Button>
          </div>
        </form>
      </div>
      <Dialog
        open={blocker.state === 'blocked'}
        title="Покинуть диалог?"
        onClose={() => blocker.state === 'blocked' && blocker.reset()}
      >
        <p>
          Есть неотправленный текст или запрос в работе. После возвращения история загрузится
          заново; черновик будет потерян.
        </p>
        <Button variant="outline" onClick={() => blocker.state === 'blocked' && blocker.reset()}>
          Остаться
        </Button>
        <Button onClick={() => blocker.state === 'blocked' && blocker.proceed()}>
          Покинуть диалог
        </Button>
      </Dialog>
    </section>
  );
}
