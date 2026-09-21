import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useBlocker, useBeforeUnload, type MetaFunction } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/atoms/Button';
import { ProgressBar } from '@/components/atoms/ProgressBar';
import { StatusPanel } from '@/components/molecules/StatusPanel';
import { Dialog } from '@/components/molecules/Dialog';
import { ExamQuestion } from '@/components/organisms/ExamQuestion';
import {
  useAssessment,
  actAssessment,
  assessmentKey,
  isAnswered,
  remainingSeconds,
  attemptStatusLabel,
  projectDraftSchema,
  type Assessment,
  type AssessmentKind,
  type Attempt,
  type AssessmentAction,
} from '@/features/assessments';
import { useSessionActions } from '@/features/auth';
import { trackKey } from '@/features/learning';
import { ApiError } from '@/shared/api/errors';
import { Workspace } from '../workspace/Workspace';
import styles from './ExamPage.module.css';
export const meta: MetaFunction = () => [
  { title: 'Проверка знаний — repeat.ai' },
  { name: 'robots', content: 'noindex, nofollow' },
];
export default function ExamPage() {
  return <AssessmentPage kind="exam" />;
}
export function AssessmentPage({ kind }: { kind: AssessmentKind }) {
  const { id = '', topic = '' } = useParams();
  return (
    <AssessmentScreen
      key={`${id}:${kind}:${topic}`}
      id={id}
      kind={kind}
      target={kind === 'exam' ? topic : 'final'}
    />
  );
}
function AssessmentScreen({
  id,
  kind,
  target,
}: {
  id: string;
  kind: AssessmentKind;
  target: string;
}) {
  const query = useAssessment(id, kind, target),
    client = useQueryClient(),
    { forget } = useSessionActions();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [revision, setRevision] = useState(0);
  const lock = useRef(false),
    startKey = useRef<string | null>(null);
  const attempt = query.data?.attempt;
  useEffect(() => {
    if (attempt?.status === 'passed') {
      void client.invalidateQueries({ queryKey: trackKey(id) });
      void client.invalidateQueries({ queryKey: ['session', 'dashboard'] });
      void client.invalidateQueries({ queryKey: ['session', 'diploma', id] });
    }
  }, [attempt?.status, client, id]);
  function update(result: Attempt) {
    client.setQueryData<Assessment>(assessmentKey(id, kind, target), (old) =>
      old
        ? {
            ...old,
            attempt: result,
            history: old.history.some((a) => a.id === result.id)
              ? old.history.map((a) =>
                  a.id === result.id ? { id: result.id, status: result.status } : a,
                )
              : [...old.history, { id: result.id, status: result.status }],
          }
        : old,
    );
  }
  async function start() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    startKey.current ??= crypto.randomUUID();
    try {
      update(await actAssessment(id, kind, target, { action: 'start' }, startKey.current));
      startKey.current = null;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) await forget();
      else setError(e instanceof Error ? e.message : 'Не удалось начать попытку.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function reload() {
    const result = await query.refetch();
    if (!result.isError) setRevision((v) => v + 1);
  }
  return (
    <Workspace
      title={query.data?.title ?? (kind === 'exam' ? 'Экзамен' : 'Учебный проект')}
      description="Проверка и результат в контексте курса"
    >
      <div className={styles.stack}>
        <nav className={styles.actions}>
          <Link to={`/app/tracks/${id}`}>К карте курса</Link>
          <Link to={`/app/tracks/${id}/tutor`}>Помощь репетитора</Link>
        </nav>
        {query.isError ? (
          <StatusPanel
            state="error"
            title="Проверка недоступна"
            description={query.error.message}
            onRetry={() => void query.refetch()}
          />
        ) : !query.data ? (
          <StatusPanel
            state="loading"
            title="Загружаем проверку"
            description="Получаем условия и сохранённую попытку."
          />
        ) : (
          <>
            <p className={styles.notice}>
              Демонстрационный учебный цикл. Оценка имитируется; реальный AI и выдача диплома ещё не
              подключены.
            </p>
            {!attempt ? (
              <section className={styles.panel}>
                <h2>Условия и допуск</h2>
                <ul>
                  {query.data.requirements.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                {!query.data.allowed && <p role="status">{query.data.reason}</p>}
                <Button
                  disabled={!query.data.allowed || busy}
                  loading={busy}
                  onClick={() => void start()}
                >
                  {kind === 'exam' ? 'Начать экзамен' : 'Начать проект'}
                </Button>
                {error && <p role="alert">{error}</p>}
              </section>
            ) : attempt.status === 'active' ? (
              <AttemptEditor
                key={`${attempt.id}:${revision}`}
                {...{ id, kind, target, attempt, update, reload }}
                requirements={query.data.requirements}
              />
            ) : (
              <section className={styles.panel}>
                <h2>{attemptStatusLabel[attempt.status]}</h2>
                {['submitted', 'evaluating'].includes(attempt.status) ? (
                  <>
                    <p role="status">
                      Работа сохранена и заблокирована для изменений. Можно вернуться позже:
                      проверка продолжится без повторной сдачи.
                    </p>
                    <Button variant="outline" onClick={() => void query.refetch()}>
                      Обновить результат
                    </Button>
                  </>
                ) : (
                  <>
                    <ul>
                      {attempt.feedback.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                    {attempt.status === 'expired' && (
                      <p>Серверный срок попытки истёк. Сохранённые ответы остались в истории.</p>
                    )}
                    <div className={styles.actions}>
                      {attempt.status === 'passed' ? (
                        <>
                          <Link to={`/app/tracks/${id}`}>Продолжить обучение</Link>
                          <Link
                            to={
                              kind === 'exam'
                                ? `/app/tracks/${id}/project`
                                : `/app/tracks/${id}/diploma`
                            }
                          >
                            {kind === 'exam' ? 'К итоговому проекту' : 'Перейти к диплому'}
                          </Link>
                        </>
                      ) : (
                        ['failed', 'expired'].includes(attempt.status) && (
                          <Button disabled={busy} onClick={() => void start()}>
                            Новая попытка
                          </Button>
                        )
                      )}
                    </div>
                    {error && <p role="alert">{error}</p>}
                  </>
                )}
                <details>
                  <summary>Сохранённая работа</summary>
                  {kind === 'exam' ? (
                    attempt.questions.map((q) => (
                      <div key={q.id}>
                        <h3>{q.title}</h3>
                        <p>
                          {Array.isArray(attempt.answers[q.id])
                            ? (attempt.answers[q.id] as string[])
                                .map((v) => q.options.find((o) => o.id === v)?.text ?? v)
                                .join(', ')
                            : (q.options.find((o) => o.id === attempt.answers[q.id])?.text ??
                              attempt.answers[q.id] ??
                              'Нет ответа')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <>
                      <p>{attempt.project.description}</p>
                      <p>{attempt.project.url}</p>
                    </>
                  )}
                </details>
              </section>
            )}
            {query.data.history.length > 0 && (
              <details className={styles.panel}>
                <summary>История попыток · {query.data.history.length}</summary>
                <ol>
                  {query.data.history.map((a, i) => (
                    <li key={a.id}>
                      Попытка {i + 1}: {attemptStatusLabel[a.status]}
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </>
        )}
      </div>
    </Workspace>
  );
}
function AttemptEditor({
  id,
  kind,
  target,
  attempt,
  update,
  reload,
  requirements,
}: {
  id: string;
  kind: AssessmentKind;
  target: string;
  attempt: Attempt;
  update: (a: Attempt) => void;
  reload: () => Promise<void>;
  requirements: string[];
}) {
  const [base, setBase] = useState(attempt),
    [answers, setAnswers] = useState(attempt.answers),
    [project, setProject] = useState(attempt.project),
    [index, setIndex] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [conflict, setConflict] = useState(false),
    [confirm, setConfirm] = useState(false),
    [now, setNow] = useState(Date.now);
  const { forget } = useSessionActions(),
    lock = useRef(false),
    operation = useRef<{ fingerprint: string; key: string } | null>(null);
  const dirty = JSON.stringify([answers, project]) !== JSON.stringify([base.answers, base.project]),
    remaining = remainingSeconds(base.dueAt, now),
    expired = remaining === 0;
  const missing = base.questions.filter((q) => !isAnswered(answers[q.id])).length;
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      (dirty || busy) && currentLocation.pathname !== nextLocation.pathname,
  );
  useBeforeUnload((e) => {
    if (dirty || busy) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
  useEffect(() => {
    if (!base.dueAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [base.dueAt]);
  const run = useCallback(
    async (body: AssessmentAction) => {
      if (lock.current) return null;
      lock.current = true;
      setBusy(true);
      setError('');
      const fingerprint = JSON.stringify(body);
      if (operation.current?.fingerprint !== fingerprint)
        operation.current = { fingerprint, key: crypto.randomUUID() };
      try {
        const result = await actAssessment(id, kind, target, body, operation.current.key);
        operation.current = null;
        update(result);
        setBase(result);
        if (body.action === 'save') {
          setAnswers(result.answers);
          setProject(result.project);
        }
        return result;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) await forget();
        else {
          setError(e instanceof Error ? e.message : 'Не удалось сохранить.');
          setConflict(e instanceof ApiError && (e.status === 409 || e.status === 403));
        }
        return null;
      } finally {
        lock.current = false;
        setBusy(false);
      }
    },
    [id, kind, target, update, forget],
  );
  const save = useCallback(async () => {
    if (conflict || expired) return null;
    if (!dirty) return base;
    const parsed = projectDraftSchema.safeParse(project);
    if (!parsed.success) {
      setError(parsed.error.issues[0]!.message);
      return null;
    }
    return run({
      action: 'save',
      attemptId: base.id,
      expectedVersion: base.version,
      answers,
      project: parsed.data,
    });
  }, [conflict, expired, dirty, base, project, answers, run]);
  useEffect(() => {
    if (!dirty || busy || error || conflict || expired || confirm) return;
    const timer = setTimeout(() => void save(), 650);
    return () => clearTimeout(timer);
  }, [dirty, busy, error, conflict, expired, confirm, save]);
  async function move(next: number) {
    const saved = await save();
    if (saved) setIndex(next);
  }
  async function prepareSubmit() {
    const saved = await save();
    if (saved) setConfirm(true);
  }
  async function submit() {
    await run({
      action: 'submit',
      attemptId: base.id,
      expectedVersion: base.version,
      allowUnanswered: true,
    });
  }
  return (
    <>
      <div className={styles.progress}>
        <span>
          {kind === 'exam'
            ? `Вопрос ${index + 1} из ${base.questions.length}`
            : 'Результат проекта'}{' '}
          · версия программы {base.planVersion}
        </span>
        {kind === 'exam' && (
          <ProgressBar
            value={((base.questions.length - missing) / base.questions.length) * 100}
            label="Заполненные ответы"
          />
        )}
        <span role="status">
          {busy ? 'Сохраняем…' : dirty ? 'Есть несохранённые изменения' : 'Сохранено'}
        </span>
        {remaining !== null && (
          <span>
            Осталось: {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
          </span>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      {expired && <p role="alert">Время истекло. Отправка и изменение ответов закрыты.</p>}
      {(conflict || expired) && (
        <Button variant="outline" onClick={() => void reload()}>
          Загрузить сохранённую попытку и заменить черновик
        </Button>
      )}
      <div className={styles.columns}>
        <section className={styles.panel}>
          {kind === 'exam' ? (
            <>
              <ExamQuestion
                question={base.questions[index]!}
                value={answers[base.questions[index]!.id]}
                disabled={busy || conflict || expired}
                onChange={(value) => {
                  setAnswers((old) => ({ ...old, [base.questions[index]!.id]: value }));
                  setError('');
                }}
              />
              <div className={styles.actions}>
                <Button
                  variant="outline"
                  disabled={index === 0 || busy || conflict || expired}
                  onClick={() => void move(index - 1)}
                >
                  Назад
                </Button>
                <Button
                  disabled={index === base.questions.length - 1 || busy || conflict || expired}
                  onClick={() => void move(index + 1)}
                >
                  Далее
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2>Результат проекта</h2>
              <label className={styles.field}>
                Описание результата
                <textarea
                  rows={8}
                  maxLength={12000}
                  readOnly={busy || conflict || expired}
                  value={project.description}
                  onChange={(e) => {
                    setProject((old) => ({ ...old, description: e.target.value }));
                    setError('');
                  }}
                />
              </label>
              <label className={styles.field}>
                Ссылка на результат (необязательно)
                <input
                  type="url"
                  maxLength={2000}
                  readOnly={busy || conflict || expired}
                  value={project.url}
                  onChange={(e) => {
                    setProject((old) => ({ ...old, url: e.target.value }));
                    setError('');
                  }}
                />
              </label>
              <p>Загрузка файлов появится после подключения серверного API.</p>
            </>
          )}
        </section>
        <aside className={styles.panel}>
          <h2>{kind === 'exam' ? 'Навигация' : 'Что отправляем'}</h2>
          {kind === 'exam' ? (
            <>
              <div className={styles.numbers}>
                {base.questions.map((q, i) => (
                  <Button
                    key={q.id}
                    variant={i === index ? 'primary' : 'outline'}
                    aria-label={`Вопрос ${i + 1}${isAnswered(answers[q.id]) ? ', заполнен' : ', без ответа'}`}
                    aria-current={i === index ? 'step' : undefined}
                    disabled={busy || conflict || expired}
                    onClick={() => void move(i)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <p>Без ответа: {missing}</p>
            </>
          ) : (
            <ul>
              {requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
          <div className={styles.stack}>
            <Button
              variant="outline"
              disabled={busy || !dirty || conflict || expired}
              onClick={() => void save()}
            >
              Сохранить сейчас
            </Button>
            <Button disabled={busy || conflict || expired} onClick={() => void prepareSubmit()}>
              {kind === 'exam' ? 'Сдать экзамен' : 'Отправить на проверку'}
            </Button>
          </div>
        </aside>
      </div>
      <Dialog
        open={confirm}
        title="Отправить работу?"
        onClose={() => {
          if (!busy) setConfirm(false);
        }}
      >
        <p>После отправки редактирование этой попытки будет закрыто.</p>
        {kind === 'exam' && missing > 0 && (
          <p>Внимание: без ответа осталось вопросов — {missing}. Подтвердите сдачу с пропусками.</p>
        )}
        {error && <p role="alert">{error}</p>}
        <Button disabled={busy || conflict || expired} onClick={() => void submit()}>
          Подтвердить отправку
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => setConfirm(false)}>
          Вернуться к работе
        </Button>
      </Dialog>
      <Dialog
        open={blocker.state === 'blocked'}
        title="Покинуть попытку?"
        onClose={() => blocker.state === 'blocked' && blocker.reset()}
      >
        <p>
          Есть несохранённые изменения или запрос в работе. При возвращении восстановится только
          подтверждённая версия.
        </p>
        <Button variant="outline" onClick={() => blocker.state === 'blocked' && blocker.reset()}>
          Остаться
        </Button>
        <Button onClick={() => blocker.state === 'blocked' && blocker.proceed()}>
          Покинуть попытку
        </Button>
      </Dialog>
    </>
  );
}
