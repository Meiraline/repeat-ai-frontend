import { useEffect, useRef, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useBlocker,
  useBeforeUnload,
  type MetaFunction,
} from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/atoms/Button';
import { Icon, type IconName } from '@/components/quarks/Icon';
import { Checkbox } from '@/components/atoms/Checkbox';
import { ProgressBar } from '@/components/atoms/ProgressBar';
import { StatusPanel } from '@/components/molecules/StatusPanel';
import { Dialog } from '@/components/molecules/Dialog';
import { PlanIllustration } from '@/components/molecules/PlanIllustration';
import { InterviewForm } from '@/components/organisms/InterviewForm';
import {
  createDraft,
  draftKey,
  generatePlan,
  isJobPending,
  retryJob,
  saveDraft,
  useDraft,
  usePlanJob,
  validateAnswer,
  type PlanDraft,
} from '@/features/plans';
import { useSessionActions } from '@/features/auth';
import { ApiError } from '@/shared/api/errors';
import { Workspace } from '../workspace/Workspace';
import { questions, stages } from './plan-content';
import styles from './PlanCreatePage.module.css';
export const meta: MetaFunction = () => [
  { title: 'Создание плана — repeat.ai' },
  { name: 'robots', content: 'noindex, nofollow' },
];
export default function PlanCreatePage() {
  const { id } = useParams();
  return id ? <ExistingPlan key={id} id={id} /> : <Introduction />;
}
function Introduction() {
  const navigate = useNavigate(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    lock = useRef(false),
    key = useRef('');
  const { forget } = useSessionActions();
  async function start() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    key.current ||= crypto.randomUUID();
    try {
      const d = await createDraft(key.current);
      void navigate(`/app/plans/${d.id}`, { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) await forget();
      else setError(e instanceof Error ? e.message : 'Не удалось создать черновик.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Workspace
      active="new"
      title="Создание плана"
      description="Введение и основные параметры нового учебного маршрута."
    >
      <Step number={1} title="Введение" />
      <div className={styles.columns}>
        <section className={styles.panel}>
          <h2>Что понадобится</h2>
          <p>Соберём бриф перед генерацией — по одному вопросу за шаг.</p>
          <ol>
            {questions.map((q) => (
              <li key={q.field}>{q.question}</li>
            ))}
          </ol>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          <div className={styles.actions}>
            <Button loading={busy} onClick={() => void start()}>
              Начать интервью
            </Button>
            <Link to="/app">Вернуться в кабинет</Link>
          </div>
          <p className={styles.note}>
            Сохранённые ответы можно открыть из кабинета и продолжить позже.
          </p>
        </section>
        <PlanIllustration
          kind="intro"
          title="Сначала соберём бриф"
          description="7 коротких шагов: цель, уровень, срок, нагрузка, форматы и ограничения."
        />
      </div>
    </Workspace>
  );
}
function Step({ number, title }: { number: number; title: string }) {
  return (
    <section className={styles.step} aria-label="Этап создания">
      <div>
        <h2>{title}</h2>
        <p>Шаг {number} из 5</p>
      </div>
      <ProgressBar value={number * 20} label="Этап создания плана" />
    </section>
  );
}
function ExistingPlan({ id }: { id: string }) {
  const query = useDraft(id);
  if (!query.data)
    return (
      <Workspace active="new" title="Создание плана">
        <StatusPanel
          state={query.isError ? 'error' : 'loading'}
          title={query.isError ? 'Не удалось открыть черновик' : 'Загружаем черновик'}
          description={query.error?.message ?? 'Проверяем сохранённые ответы.'}
          onRetry={query.isError ? () => void query.refetch() : undefined}
        />
      </Workspace>
    );
  return <Editor initial={query.data} />;
}
function Editor({ initial }: { initial: PlanDraft }) {
  const [draft, setDraft] = useState(initial),
    [answer, setAnswer] = useState(
      initial.brief[(questions[Math.min(initial.step, 6)] ?? questions[0]).field],
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [conflict, setConflict] = useState(false),
    [accepted, setAccepted] = useState(initial.acceptedRisk);
  const lock = useRef(false),
    retryKey = useRef(''),
    allowLeave = useRef(false),
    heading = useRef<HTMLHeadingElement>(null);
  const navigate = useNavigate(),
    client = useQueryClient(),
    { forget } = useSessionActions();
  const job = usePlanJob(draft.jobId);
  const question = questions[Math.min(draft.step, 6)] ?? questions[0];
  const dirty = draft.phase === 'interview' && answer !== draft.brief[question.field];
  const blocker = useBlocker(() => !allowLeave.current && (dirty || busy));
  useBeforeUnload((e) => {
    if (dirty || busy) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
  useEffect(() => {
    heading.current?.focus();
  }, [draft.phase]);
  async function run(operation: () => Promise<PlanDraft>, exit = false) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setConflict(false);
    try {
      const next = await operation();
      client.setQueryData(draftKey(next.id), next);
      void client.invalidateQueries({ queryKey: ['session', 'plans'], exact: true });
      setDraft(next);
      setAccepted(next.acceptedRisk);
      setAnswer(next.brief[(questions[Math.min(next.step, 6)] ?? questions[0]).field]);
      if (exit) {
        allowLeave.current = true;
        void navigate('/app');
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        allowLeave.current = true;
        await forget();
      } else {
        setError(e instanceof Error ? e.message : 'Не удалось сохранить. Ответ остался в поле.');
        setConflict(e instanceof ApiError && e.status === 409);
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function submit(exit = false) {
    const validation = validateAnswer(question.field, answer);
    if (validation && !exit) {
      setError(validation);
      return;
    }
    const last = draft.step === 6;
    void run(
      () =>
        saveDraft({
          ...draft,
          brief: { ...draft.brief, [question.field]: answer },
          step: exit ? draft.step : Math.min(6, draft.step + 1),
          phase: !exit && last ? 'risk' : 'interview',
        }),
      exit,
    );
  }
  async function reload() {
    const fresh = await client.fetchQuery({ queryKey: draftKey(draft.id), staleTime: 0 });
    if (fresh) {
      const saved = fresh as PlanDraft;
      setDraft({
        ...saved,
        ...(saved.phase === 'interview' && draft.phase === 'interview' ? { step: draft.step } : {}),
      });
      setConflict(false);
      setError('Сохранённая версия загружена. Ваш текущий ответ остался в поле.');
    }
  }
  const number =
    draft.phase === 'interview'
      ? 2
      : draft.phase === 'risk'
        ? 3
        : draft.phase === 'summary'
          ? 4
          : 5;
  const title =
    draft.phase === 'interview'
      ? 'AI-интервью'
      : draft.phase === 'risk'
        ? 'Проверка срока'
        : draft.phase === 'summary'
          ? 'Сводка брифа'
          : 'Генерация';
  const edit = (step: number) => void run(() => saveDraft({ ...draft, phase: 'interview', step }));
  return (
    <Workspace
      active="new"
      title="Создание плана"
      description="От цели — к вашему учебному маршруту."
    >
      <Step number={number} title={title} />
      {error && (
        <div className={styles.panel}>
          <p role="alert" className={styles.error}>
            {error}
          </p>
          {conflict && (
            <Button
              variant="outline"
              onClick={() =>
                void reload().catch(() =>
                  setError('Не удалось обновить версию. Попробуйте ещё раз.'),
                )
              }
            >
              Загрузить сохранённую версию
            </Button>
          )}
        </div>
      )}
      <div className={styles.columns}>
        <section className={styles.panel}>
          {draft.phase === 'interview' ? (
            <>
              <h2>История диалога</h2>
              <div className={styles.history}>
                {questions.slice(0, draft.step).map((q) => (
                  <details key={q.field}>
                    <summary>{q.question}</summary>
                    <p>{draft.brief[q.field]}</p>
                  </details>
                ))}
              </div>
              <InterviewForm
                question={question.question}
                hint={question.hint}
                type={'type' in question ? question.type : 'text'}
                value={answer}
                onChange={(value) => {
                  setAnswer(value);
                  setError('');
                }}
                onSubmit={() => submit()}
                onSave={() => submit(true)}
                onBack={
                  draft.step
                    ? () =>
                        void run(() =>
                          saveDraft({
                            ...draft,
                            brief: { ...draft.brief, [question.field]: answer },
                            step: draft.step - 1,
                          }),
                        )
                    : undefined
                }
                busy={busy}
                error={error}
                maxLength={
                  question.field === 'skill'
                    ? 200
                    : question.field === 'targetOutcome' || question.field === 'constraints'
                      ? 2000
                      : 500
                }
              />
            </>
          ) : draft.phase === 'risk' ? (
            <>
              <h2 ref={heading} tabIndex={-1}>
                {draft.risk === 'high' ? 'Срок требует решения' : 'Срок выглядит реалистичным'}
              </h2>
              <p>Цель: {draft.brief.targetOutcome}</p>
              <p>
                Срок: {draft.brief.targetDate} · {draft.brief.hoursPerWeek} ч/нед.
              </p>
              {draft.risk === 'high' && (
                <>
                  <p className={styles.risk}>
                    Цель и доступное время могут не совпасть. Увеличьте срок, измените нагрузку или
                    сузьте цель.
                  </p>
                  <div className={styles.actions}>
                    <Button variant="outline" disabled={busy} onClick={() => edit(3)}>
                      Изменить срок
                    </Button>
                    <Button variant="outline" disabled={busy} onClick={() => edit(4)}>
                      Изменить нагрузку
                    </Button>
                    <Button variant="outline" disabled={busy} onClick={() => edit(1)}>
                      Сузить цель
                    </Button>
                  </div>
                  <label className={styles.consent}>
                    <Checkbox
                      checked={accepted}
                      disabled={busy}
                      onChange={(e) => setAccepted(e.target.checked)}
                    />
                    Я понимаю, что могу не успеть, и принимаю риск срока.
                  </label>
                </>
              )}
              <Button
                loading={busy}
                disabled={draft.risk === 'high' && !accepted}
                onClick={() =>
                  void run(() => saveDraft({ ...draft, acceptedRisk: accepted, phase: 'summary' }))
                }
              >
                Продолжить к сводке
              </Button>
            </>
          ) : draft.phase === 'summary' ? (
            <>
              <h2 ref={heading} tabIndex={-1}>
                {draft.brief.skill}
              </h2>
              <p>Бриф заполнен. Проверьте ответы перед генерацией.</p>
              <dl className={styles.summary}>
                {questions.map((q, i) => (
                  <div key={q.field} style={{ display: 'contents' }}>
                    <dt>{q.label}</dt>
                    <dd>
                      {draft.brief[q.field]}{' '}
                      <Button
                        variant="neutral"
                        size="small"
                        disabled={busy}
                        onClick={() => edit(i)}
                        aria-label={`Изменить: ${q.label}`}
                      >
                        Изменить
                      </Button>
                    </dd>
                  </div>
                ))}
              </dl>
              {draft.acceptedRisk && <p className={styles.risk}>Риск срока принят.</p>}
              <p className={styles.note}>
                Будет создан черновик программы. Его утверждение и начало обучения — отдельный
                следующий шаг.
              </p>
              <Button loading={busy} onClick={() => void run(() => generatePlan(draft))}>
                Составить программу
              </Button>
            </>
          ) : (
            <>
              <h2 ref={heading} tabIndex={-1}>
                {job.data?.status === 'succeeded'
                  ? 'Черновик плана готов'
                  : job.data?.status === 'partial'
                    ? 'Получен частичный результат'
                    : job.data?.status === 'failed'
                      ? 'Генерация не завершена'
                      : 'Создаём учебный план'}
              </h2>
              {job.isError ? (
                <StatusPanel
                  state="error"
                  title="Не удалось проверить статус"
                  description="Работа могла продолжиться. Обновите статус — повторно запускать генерацию не нужно."
                  onRetry={() => void job.refetch()}
                />
              ) : job.data ? (
                <>
                  <ProgressBar value={job.data.progress} label="Готовность черновика" />
                  <p role="status">
                    {isJobPending(job.data.status)
                      ? `Сейчас: ${stages[Math.min(job.data.stage, 4)]!.toLowerCase()}`
                      : job.data.message ||
                        'Черновик сохранён. Можно вернуться к нему из кабинета.'}
                  </p>
                  {job.data.delayed && (
                    <p className={styles.note}>
                      Это занимает больше времени, чем обычно. Можно вернуться в кабинет и открыть
                      статус позже.
                    </p>
                  )}
                  <ol className={styles.jobs}>
                    {stages.map((s, i) => (
                      <li key={s}>
                        <Icon name={`phase${i + 1}` as IconName} size={44} />
                        <strong>
                          {i + 1}. {s}
                        </strong>
                        <span>
                          {i < job.data!.stage
                            ? 'Готово'
                            : i === job.data!.stage && isJobPending(job.data!.status)
                              ? 'Сейчас'
                              : job.data!.status === 'failed' || job.data!.status === 'partial'
                                ? 'Не завершено'
                                : 'Далее'}
                        </span>
                      </li>
                    ))}
                  </ol>
                  {job.data.topics.length > 0 && (
                    <section aria-label="Черновик программы">
                      <h3>Черновик программы</h3>
                      <ol>
                        {job.data.topics.map((t) => (
                          <li key={t.id}>
                            <strong>{t.title}</strong>
                            <p>{t.description}</p>
                          </li>
                        ))}
                      </ol>
                      <p className={styles.note}>
                        Проверьте темы и источники перед утверждением программы.
                      </p>
                      <Link to={`/app/plans/${draft.id}/review`}>Проверить программу</Link>
                    </section>
                  )}
                  {['failed', 'partial'].includes(job.data.status) && (
                    <Button
                      loading={busy}
                      onClick={() => {
                        retryKey.current ||= crypto.randomUUID();
                        void run(async () => {
                          const d = await retryJob(draft, retryKey.current);
                          retryKey.current = '';
                          return d;
                        });
                      }}
                    >
                      Повторить генерацию
                    </Button>
                  )}
                </>
              ) : (
                <StatusPanel
                  state="loading"
                  title="Получаем статус задания"
                  description="Проверяем состояние генерации."
                />
              )}
            </>
          )}
          {draft.phase !== 'interview' && (
            <div className={styles.actions}>
              <Link to="/app">В кабинет</Link>
            </div>
          )}
        </section>
        <aside className={styles.aside}>
          <PlanIllustration
            kind={
              draft.phase === 'interview'
                ? 'mentor'
                : draft.phase === 'risk'
                  ? 'risk'
                  : draft.phase === 'summary'
                    ? 'summary'
                    : 'generation'
            }
            title={
              draft.phase === 'interview'
                ? 'Лира'
                : draft.phase === 'risk'
                  ? 'Проверьте нагрузку'
                  : draft.phase === 'summary'
                    ? 'Бриф готов к запуску'
                    : 'Что будет создано'
            }
            description={
              draft.phase === 'interview'
                ? 'Поможет собрать вашу цель и предпочтения.'
                : 'Структура тем, практика и контрольные точки — с учётом ваших ответов.'
            }
          />
          {draft.phase === 'interview' && (
            <section className={styles.panel}>
              <h2>Сводка брифа</h2>
              <p>Вопрос {draft.step + 1} из 7</p>
              <ol>
                {questions.map((q, i) => (
                  <li key={q.field}>
                    {q.label} ·{' '}
                    {i === draft.step
                      ? 'Сейчас'
                      : draft.brief[q.field]
                        ? 'Сохранено'
                        : 'Не заполнено'}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </aside>
      </div>
      <Dialog
        open={blocker.state === 'blocked'}
        title="Есть несохранённый ответ"
        onClose={() => blocker.state === 'blocked' && blocker.reset()}
      >
        <p>Останьтесь и нажмите «Сохранить и выйти», чтобы сохранить текущий ответ.</p>
        <div className={styles.actions}>
          <Button onClick={() => blocker.state === 'blocked' && blocker.reset()}>Остаться</Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => blocker.state === 'blocked' && blocker.proceed()}
          >
            Уйти без сохранения
          </Button>
        </div>
      </Dialog>
    </Workspace>
  );
}
