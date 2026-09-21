import { useRef, useState } from 'react';
import {
  Link,
  useBlocker,
  useBeforeUnload,
  useOutletContext,
  useParams,
  type MetaFunction,
} from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/atoms/Button';
import { Checkbox } from '@/components/atoms/Checkbox';
import { Dialog } from '@/components/molecules/Dialog';
import { StatusPanel } from '@/components/molecules/StatusPanel';
import { PlanDiffRow } from '@/components/molecules/PlanDiffRow';
import { PlanReviewProgram } from '@/components/organisms/PlanReviewProgram';
import {
  changeReview,
  getReview,
  useReview,
  reviewKey,
  sourceGaps,
  programDiff,
  type Review,
  type ReviewAction,
} from '@/features/plans';
import { useSessionActions, type Profile } from '@/features/auth';
import { ApiError } from '@/shared/api/errors';
import mentor from '@/assets/screens/plan-mentor.png';
import ready from '@/assets/screens/plan-intro.png';
import badge from '@/assets/screens/review-badge.png';
import warning from '@/assets/screens/review-warning.png';
import { Workspace } from '../workspace/Workspace';
import styles from './PlanReviewPage.module.css';
export const meta: MetaFunction = () => [
  { title: 'Согласование программы — repeat.ai' },
  { name: 'robots', content: 'noindex, nofollow' },
];
export default function PlanReviewPage() {
  const { id = '' } = useParams(),
    query = useReview(id);
  if (!query.data)
    return (
      <Workspace title="Согласование программы">
        <StatusPanel
          state={query.isError ? 'error' : 'loading'}
          title={query.isError ? 'Программа недоступна' : 'Загружаем программу'}
          description={query.error?.message ?? 'Получаем сохранённую версию.'}
          onRetry={query.isError ? () => void query.refetch() : undefined}
        />
        <Link to={`/app/plans/${id}`}>К статусу генерации</Link>
      </Workspace>
    );
  return <ReviewEditor key={id} review={query.data} />;
}
function ReviewEditor({ review }: { review: Review }) {
  const client = useQueryClient(),
    { forget } = useSessionActions(),
    profile = useOutletContext<Profile>();
  const [text, setText] = useState(''),
    [kind, setKind] = useState<'practice' | 'workload' | 'format' | 'note'>('note');
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [conflict, setConflict] = useState(false);
  const [modal, setModal] = useState<'diff' | 'approve' | null>(null),
    [parameters, setParameters] = useState(false),
    [gapsAccepted, setGapsAccepted] = useState(false);
  const lock = useRef(false),
    keys = useRef(new Map<string, string>()),
    leaving = useRef(false);
  const dirty = !!text.trim();
  const blocker = useBlocker(() => !leaving.current && (dirty || lock.current));
  useBeforeUnload((event) => {
    if (dirty || lock.current) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
  const program = review.program,
    gaps = sourceGaps(program),
    proposal = review.proposal;
  async function run(action: ReviewAction) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setConflict(false);
    const signature = JSON.stringify(action);
    let key = keys.current.get(signature);
    if (!key) {
      key = crypto.randomUUID();
      keys.current.set(signature, key);
    }
    try {
      const next = await changeReview(review.id, action, key);
      client.setQueryData(reviewKey(review.id), next);
      keys.current.delete(signature);
      if (action.action === 'propose') setText('');
      else {
        setModal(null);
        setParameters(false);
        setGapsAccepted(false);
      }
      await client.invalidateQueries({ queryKey: ['session', 'dashboard'] });
      await client.invalidateQueries({ queryKey: ['session', 'plans'], exact: true });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        leaving.current = true;
        await forget();
      } else {
        setError(e instanceof Error ? e.message : 'Не удалось сохранить. Повторите действие.');
        setConflict(e instanceof ApiError && e.status === 409);
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function refresh() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await client.fetchQuery({
        queryKey: reviewKey(review.id),
        queryFn: ({ signal }) => getReview(review.id, signal),
        staleTime: 0,
      });
      setModal(null);
      setParameters(false);
      setGapsAccepted(false);
      setError('');
      setConflict(false);
      keys.current.clear();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось обновить программу.');
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
        <Button variant="outline" disabled={busy} onClick={() => void refresh()}>
          Загрузить актуальную версию
        </Button>
      )}
    </>
  );
  function openApproval() {
    setParameters(false);
    setGapsAccepted(false);
    setModal('approve');
    setError('');
  }
  return (
    <Workspace
      title={review.track ? 'Программа готова' : 'Согласование программы'}
      active="new"
      description={
        review.track
          ? 'Учебный маршрут утверждён.'
          : 'Проверьте структуру, источники и ограничения перед началом обучения.'
      }
    >
      <div className={styles.root}>
        {!modal && feedback}
        {review.track ? (
          <div className={styles.columns}>
            <section className={styles.panel}>
              <span className={styles.chip}>Активный трек</span>
              <h2>Учебный трек создан</h2>
              <p>Версия v{review.version} утверждена. Программа сохранена.</p>
              <h3>{program.title}</h3>
              <p>{program.goal}</p>
              <div className={styles.metrics}>
                <p>
                  <small>Темы</small>
                  <strong>{program.topics.length}</strong>
                </p>
                <p>
                  <small>Срок</small>
                  <strong>{program.targetDate}</strong>
                </p>
                <p>
                  <small>Нагрузка</small>
                  <strong>{program.hoursPerWeek} ч/нед</strong>
                </p>
              </div>
              <div className={styles.note}>
                <h3>Что дальше</h3>
                <p>
                  Первая тема: {program.topics[0]?.title}. Откройте карту курса и изучите доступные
                  материалы.
                </p>
              </div>
              <Link to="/app">Открыть мои курсы</Link>
              <p>
                <Link to={`/app/tracks/${review.track.id}`}>Начать обучение</Link>
              </p>
              <details>
                <summary>Утверждённая программа</summary>
                <PlanReviewProgram
                  title={program.title}
                  goal={program.goal}
                  topics={program.topics}
                />
              </details>
            </section>
            <aside className={styles.panel}>
              <div className={styles.ready}>
                <img src={ready} alt="" />
              </div>
              <h2>Программа готова</h2>
              <p>Утверждённая версия v{review.version} сохранена.</p>
            </aside>
          </div>
        ) : (
          <>
            <section className={styles.version} aria-label="Версия программы">
              <span className={styles.badge}>
                <img src={badge} alt="" />
              </span>
              <div>
                <strong>Черновик v{review.version} · готов к проверке</strong>
                <p>
                  {program.topics.length} темы · {gaps.length} без проверенного источника
                </p>
              </div>
            </section>
            {gaps.length > 0 && (
              <div className={styles.warning}>
                <img src={warning} alt="" width={42} height={42} />
                <div>
                  <strong>Есть пробелы в материалах: {gaps.length}</strong>
                  <p>
                    Откройте источники в карточках тем. При утверждении потребуется принять эти
                    ограничения.
                  </p>
                </div>
              </div>
            )}
            <div className={styles.columns}>
              <div className={styles.stack}>
                <section className={styles.panel}>
                  <span className={styles.chip}>Черновик · v{review.version}</span>
                  <h2>Параметры программы</h2>
                  <dl className={styles.summary}>
                    <div>
                      <dt>Срок</dt>
                      <dd>{program.targetDate}</dd>
                    </div>
                    <div>
                      <dt>Нагрузка</dt>
                      <dd>{program.hoursPerWeek} ч/нед</dd>
                    </div>
                    <div>
                      <dt>Форматы</dt>
                      <dd>{program.formats}</dd>
                    </div>
                    <div>
                      <dt>Ограничения</dt>
                      <dd>{program.constraints}</dd>
                    </div>
                  </dl>
                </section>
                <PlanReviewProgram
                  title={program.title}
                  goal={program.goal}
                  topics={program.topics}
                />
              </div>
              <aside className={styles.stack}>
                <section className={styles.panel}>
                  <div className={styles.mentor}>
                    <img src={mentor} width={52} height={52} alt="" />
                    <div>
                      <h2>AI-правки</h2>
                      <small>Версия {review.version}</small>
                    </div>
                  </div>
                  <p>Опишите желаемое изменение. Программа изменится только после применения.</p>
                  <p className={styles.note}>
                    Демонстрация без AI: подсказки показывают типовые изменения. Свободный запрос
                    добавляется в пожелания программы.
                  </p>
                  <div className={styles.suggestions}>
                    {(
                      [
                        { kind: 'workload', label: 'Сократи нагрузку' },
                        { kind: 'format', label: 'Замени видео статьями' },
                        { kind: 'practice', label: 'Добавь практику' },
                      ] as const
                    ).map((s) => (
                      <Button
                        key={s.kind}
                        variant="neutral"
                        size="small"
                        disabled={busy || !!proposal}
                        onClick={() => {
                          setKind(s.kind);
                          setText(s.label);
                        }}
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                  {proposal ? (
                    <div className={styles.note}>
                      <strong>Предложение готово</strong>
                      <p>{proposal.request}</p>
                      <p>На основе v{proposal.baseVersion}. Текущая программа ещё не изменена.</p>
                      <Button
                        fullWidth
                        disabled={busy}
                        onClick={() => {
                          setModal('diff');
                          setError('');
                        }}
                      >
                        Показать изменения
                      </Button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void run({
                          action: 'propose',
                          expectedPlanVersion: review.version,
                          text,
                          kind,
                        });
                      }}
                    >
                      <label htmlFor="review-request">Ваш запрос</label>
                      <textarea
                        id="review-request"
                        value={text}
                        maxLength={5000}
                        required
                        disabled={busy}
                        onChange={(e) => {
                          setText(e.target.value);
                          setKind('note');
                        }}
                      />
                      <Button
                        type="submit"
                        loading={busy}
                        disabled={!text.trim() || conflict}
                        fullWidth
                      >
                        Предложить изменения
                      </Button>
                    </form>
                  )}
                  <p className={styles.note}>
                    Можно продолжить позже. Отправленное предложение сохраняется вместе с
                    программой.
                  </p>
                </section>
                <Button disabled={busy || !!proposal || dirty || conflict} onClick={openApproval}>
                  Согласовать программу
                </Button>
                {proposal && (
                  <small>Примените или отклоните предложение перед согласованием.</small>
                )}
                <Link to="/app">В кабинет</Link>
              </aside>
            </div>
          </>
        )}
      </div>
      <Dialog
        wide
        open={modal === 'diff'}
        title="Изменения программы"
        onClose={() => {
          if (!busy) setModal(null);
        }}
      >
        {proposal && (
          <div className={styles.stack}>
            <span className={styles.chip}>
              Версия {proposal.baseVersion} → {proposal.baseVersion + 1}
            </span>
            {programDiff(program, proposal.program).map((row, i) => (
              <PlanDiffRow key={i} {...row} />
            ))}
            <p className={styles.note}>
              До нажатия «Применить изменения» текущая программа остаётся без изменений.
            </p>
            {proposal.baseVersion !== review.version && (
              <p role="alert">
                Предложение устарело. Отклоните его и создайте новое для текущей версии.
              </p>
            )}
            {feedback}
            <div className={styles.actions}>
              <Button
                variant="outline"
                disabled={busy || conflict}
                onClick={() =>
                  void run({
                    action: 'reject',
                    expectedPlanVersion: review.version,
                    proposalId: proposal.id,
                  })
                }
              >
                Отклонить
              </Button>
              <Button
                loading={busy}
                disabled={conflict || proposal.baseVersion !== review.version}
                onClick={() =>
                  void run({
                    action: 'apply',
                    expectedPlanVersion: review.version,
                    proposalId: proposal.id,
                  })
                }
              >
                Применить изменения
              </Button>
              <Button variant="neutral" disabled={busy} onClick={() => setModal(null)}>
                Закрыть
              </Button>
            </div>
          </div>
        )}
      </Dialog>
      <Dialog
        wide
        open={modal === 'approve'}
        title="Начать обучение"
        onClose={() => {
          if (!busy) setModal(null);
        }}
      >
        <div className={styles.stack}>
          <p>
            Утверждается версия v{review.version}. После подтверждения будет создан один активный
            трек.
          </p>
          <dl className={styles.summary}>
            <div>
              <dt>Цель</dt>
              <dd>{program.goal}</dd>
            </div>
            <div>
              <dt>Срок</dt>
              <dd>{program.targetDate}</dd>
            </div>
            <div>
              <dt>Нагрузка</dt>
              <dd>{program.hoursPerWeek} ч/нед</dd>
            </div>
            <div>
              <dt>Темы</dt>
              <dd>{program.topics.length}</dd>
            </div>
          </dl>
          {gaps.length > 0 && (
            <div className={styles.warning}>
              <div>
                <strong>{gaps.length} темы без проверенного источника</strong>
                <ul>
                  {gaps.map((g) => (
                    <li key={g.id}>{g.title}</li>
                  ))}
                </ul>
                <p>Темы останутся в программе. Источники не будут помечены как проверенные.</p>
              </div>
            </div>
          )}
          <label className={styles.check}>
            <Checkbox
              checked={parameters}
              disabled={busy}
              onChange={(e) => setParameters(e.target.checked)}
            />
            Подтверждаю параметры программы и выбранную нагрузку
          </label>
          {gaps.length > 0 && (
            <label className={styles.check}>
              <Checkbox
                checked={gapsAccepted}
                disabled={busy}
                onChange={(e) => setGapsAccepted(e.target.checked)}
              />
              Принимаю пробелы в материалах текущей версии
            </label>
          )}
          {feedback}
          <div className={styles.actions}>
            <Button variant="outline" disabled={busy} onClick={() => setModal(null)}>
              Вернуться к правкам
            </Button>
            <Button
              loading={busy}
              disabled={!parameters || (gaps.length > 0 && !gapsAccepted) || conflict}
              onClick={() =>
                void run({
                  action: 'approve',
                  expectedPlanVersion: review.version,
                  timezone: profile.timezone,
                  acknowledgements: { parameters: true, gaps: gapsAccepted },
                })
              }
            >
              Начать обучение
            </Button>
          </div>
        </div>
      </Dialog>
      <Dialog
        open={blocker.state === 'blocked'}
        title="Есть несохранённый запрос"
        onClose={() => blocker.state === 'blocked' && blocker.reset()}
      >
        <p>Отправьте запрос, чтобы сохранить предложение. Не уходите, пока выполняется операция.</p>
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
