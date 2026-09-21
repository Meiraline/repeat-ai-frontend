import { useState } from 'react';
import { Link, useNavigate, useSearchParams, type MetaFunction } from 'react-router';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/quarks/Icon';
import { StatusPanel } from '@/components/molecules/StatusPanel';
import { Dialog } from '@/components/molecules/Dialog';
import { CourseCard } from '@/components/molecules/CourseCard';
import { DeadlineCalendar } from '@/components/organisms/DeadlineCalendar';
import { useDashboard } from '@/features/courses';
import { useDrafts } from '@/features/plans';
import emptyImage from '@/assets/screens/courses-empty.png';
import nextImage from '@/assets/screens/courses-next.png';
import deadlineIcon from '@/assets/screens/metric-deadline.png';
import tracksIcon from '@/assets/screens/metric-tracks.png';
import attentionIcon from '@/assets/screens/metric-attention.png';
import { Workspace } from '../workspace/Workspace';
import styles from './CoursesPage.module.css';
export const meta: MetaFunction = () => [
  { title: 'Мои курсы — repeat.ai' },
  { name: 'robots', content: 'noindex, nofollow' },
];
export default function CoursesPage() {
  const [params, setParams] = useSearchParams(),
    navigate = useNavigate();
  const selected = params.get('filter'),
    filter = selected === 'attention' || selected === 'completed' ? selected : 'active';
  const dashboard = useDashboard(filter),
    drafts = useDrafts(),
    [opened, setOpened] = useState<string | null>(null);
  const course = dashboard.data?.tracks.find((t) => t.id === opened);
  const data = dashboard.data;
  return (
    <Workspace
      description="Все курсы, ближайшие дедлайны и действия, которые требуют внимания."
      action={<Button onClick={() => void navigate('/app/plans/new')}>Новый курс</Button>}
    >
      {drafts.isError && (
        <StatusPanel
          state="error"
          title="Не удалось загрузить черновики"
          description="Курсы остаются доступны. Попробуйте обновить список черновиков."
          onRetry={() => void drafts.refetch()}
        />
      )}
      {!!drafts.data?.length && (
        <section className={styles.drafts}>
          <h2>Черновики планов</h2>
          <ul>
            {drafts.data
              .filter((d) => !data?.tracks.some((t) => t.planId === d.id))
              .map((d) => (
                <li key={d.id}>
                  <div>
                    <strong>{d.brief.skill || 'Новая учебная цель'}</strong>
                    <p>
                      {d.phase === 'generation'
                        ? 'Генерация запущена — открыть фактический статус'
                        : `Сохранённый бриф · ${Object.values(d.brief).filter(Boolean).length} из 7 ответов`}
                    </p>
                  </div>
                  <Link to={`/app/plans/${d.id}`}>
                    {d.phase === 'generation' ? 'Открыть результат' : 'Продолжить интервью'}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      )}
      {dashboard.isPending ? (
        <StatusPanel
          state="loading"
          title="Загружаем обучение"
          description="Это займёт немного времени."
        />
      ) : dashboard.isError ? (
        <StatusPanel
          state="error"
          title="Не удалось загрузить обучение"
          description="Проверьте подключение или попробуйте ещё раз."
          onRetry={() => void dashboard.refetch()}
        />
      ) : (
        data && (
          <>
            {data.partialErrors.length > 0 && (
              <p role="status">Часть данных недоступна. Показаны успешно загруженные курсы.</p>
            )}
            <div className={styles.filters} role="group" aria-label="Фильтр курсов">
              {(['active', 'attention', 'completed'] as const).map((value, i) => (
                <Button
                  key={value}
                  variant={filter === value ? 'primary' : 'neutral'}
                  size="small"
                  aria-pressed={filter === value}
                  onClick={() => setParams({ filter: value })}
                >
                  {['Активные', 'Требуют внимания', 'Завершённые'][i]}
                </Button>
              ))}
            </div>
            {!data.tracks.length ? (
              <section className={styles.empty}>
                {filter === 'active' ? (
                  <>
                    <img src={emptyImage} alt="" width={420} height={350} />
                    <h2>Начните с первого курса</h2>
                    <p>
                      Опишите цель — ИИ поможет собрать реалистичный план и распределить обучение по
                      срокам.
                    </p>
                    <Button onClick={() => void navigate('/app/plans/new')}>
                      Создать первый курс
                    </Button>
                    <small>
                      После утверждения программы здесь появятся прогресс, дедлайны и ближайшие
                      шаги.
                    </small>
                  </>
                ) : (
                  <>
                    <h2>
                      {filter === 'attention'
                        ? 'Нет курсов, требующих внимания'
                        : 'Завершённых курсов пока нет'}
                    </h2>
                    <Button variant="outline" onClick={() => setParams({ filter: 'active' })}>
                      Показать активные
                    </Button>
                  </>
                )}
              </section>
            ) : (
              <div className={styles.columns}>
                <div>
                  <section className={styles.next}>
                    <img src={nextImage} width={160} height={150} alt="" />
                    <div>
                      <h2>Ваш следующий шаг</h2>
                      <strong>{data.tracks[0]!.title}</strong>
                      <p>
                        {data.tracks[0]!.currentTopic?.title ?? 'Посмотреть программу обучения'}
                      </p>
                    </div>
                    <Button onClick={() => setOpened(data.tracks[0]!.id)}>Программа</Button>
                  </section>
                  <div className={styles.metrics}>
                    {[
                      [
                        deadlineIcon,
                        'Ближайший дедлайн',
                        data.summary.nextDeadline
                          ? new Date(data.summary.nextDeadline).toLocaleDateString('ru-RU')
                          : 'Нет',
                      ],
                      [tracksIcon, 'Активные курсы', String(data.summary.activeTrackCount)],
                      [attentionIcon, 'Требуют внимания', String(data.summary.attentionCount)],
                    ].map(([icon, label, value]) => (
                      <div key={label}>
                        <img src={icon} width={50} height={50} alt="" />
                        <span>
                          <small>{label}</small>
                          <strong>{value}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                  <section className={styles.cards} aria-label="Учебные программы">
                    {data.tracks.map((t) => (
                      <CourseCard
                        key={t.id}
                        title={t.title}
                        progress={t.progressPercent}
                        topic={t.currentTopic?.title}
                        risk={t.riskStatus}
                        deadline={t.nextDeadline}
                        onOpen={() => setOpened(t.id)}
                      />
                    ))}
                    <Link className={styles.add} to="/app/plans/new">
                      <Icon name="plus" size={48} />
                      Создать новый курс
                    </Link>
                  </section>
                </div>
                <DeadlineCalendar
                  deadlines={data.tracks.flatMap((t) =>
                    t.nextDeadline ? [{ id: t.id, title: t.title, date: t.nextDeadline }] : [],
                  )}
                />
              </div>
            )}
          </>
        )
      )}
      <Dialog open={!!course} title={course?.title ?? 'Программа'} onClose={() => setOpened(null)}>
        <p>Пройдено: {course?.progressPercent}%</p>
        <p>Текущая тема: {course?.currentTopic?.title ?? 'Не назначена'}</p>
        {course?.planId ? (
          <>
            <p>
              <Link to={`/app/tracks/${course.id}`}>Продолжить обучение</Link>
            </p>
            <Link to={`/app/plans/${course.planId}/review`}>Открыть утверждённую программу</Link>
          </>
        ) : (
          <p>Полная программа и продолжение обучения будут доступны на следующих этапах.</p>
        )}
        <Button variant="outline" onClick={() => setOpened(null)}>
          Закрыть
        </Button>
      </Dialog>
    </Workspace>
  );
}
