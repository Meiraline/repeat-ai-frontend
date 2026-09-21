import { useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/atoms/Button';
import { PricingCard } from '@/components/molecules/PricingCard';
import { StatusPanel } from '@/components/molecules/StatusPanel';
import { createCheckout, useBilling, setAutoRenew, simulatePayment } from '@/features/billing';
import { useSessionActions } from '@/features/auth';
import { env } from '@/shared/config/env';
import { Workspace } from '../workspace/Workspace';
import styles from './BillingPage.module.css';
export function meta() {
  return [{ title: 'Тариф и оплата — repeat.ai' }, { name: 'robots', content: 'noindex' }];
}
const money = (price: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(price);
const date = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' }).format(new Date(value));

export default function BillingPage() {
  const { forget } = useSessionActions();
  const { query, busy, error, confirmCancel, setConfirmCancel, act, refresh } = useBilling(forget);
  const navigate = useNavigate(),
    location = useLocation();
  const [params] = useSearchParams();
  const checkoutKey = useRef<string | null>(null);
  async function startCheckout() {
    checkoutKey.current ??= crypto.randomUUID();
    const data = await act((signal) => createCheckout(checkoutKey.current!, signal));
    if (data?.checkout)
      void navigate('/app/billing/return?checkout=' + encodeURIComponent(data.checkout.id));
  }
  const data = query.data,
    checkout = data?.checkout;
  const mode = location.pathname.endsWith('/checkout')
    ? 'checkout'
    : location.pathname.endsWith('/return')
      ? 'return'
      : 'plans';
  const plan = data?.plans.find((p) => p.id === 'pilot');
  const locked = busy || !!error || query.isFetching;
  const returnMatches = !!checkout && params.get('checkout') === checkout.id;
  return (
    <Workspace active="billing" title="Тариф и оплата" description="Тарифы, подписка и лимиты ИИ.">
      <div className={styles.layout}>
        <nav className={styles.navigation} aria-label="Разделы аккаунта">
          <Link to="/app/settings">Профиль и интерфейс</Link>
          <Link to="/app/billing" aria-current="page">
            Тариф и оплата
          </Link>
        </nav>
        <div className={styles.panel}>
          {env.enableMocks && (
            <p className={styles.notice}>
              Демонстрация оплаты. Цены и лимиты взяты из макета. Деньги не списываются, реальная
              подписка не оформляется.
            </p>
          )}
          {query.isError ? (
            <StatusPanel
              state="error"
              title="Тарифы недоступны"
              description={query.error.message}
              onRetry={() => void refresh()}
            />
          ) : !data || !plan ? (
            <StatusPanel
              state="loading"
              title="Загружаем тарифы"
              description="Проверяем состояние подписки."
            />
          ) : (
            <>
              {error && <p role="alert">{error}</p>}
              <div className={styles.actions}>
                <Button
                  variant="neutral"
                  disabled={busy || query.isFetching}
                  onClick={() => void refresh()}
                >
                  Обновить статус
                </Button>
              </div>
              {mode === 'plans' && (
                <>
                  <h2>Тарифы</h2>
                  <p>Выберите уровень доступа для обучения.</p>
                  <div className={styles.cards}>
                    {data.plans.map((item) => (
                      <PricingCard
                        key={item.id}
                        {...item}
                        trialDays={data.trialUsed ? 0 : item.trialDays}
                        current={data.subscription.planId === item.id}
                        available={item.available && data.subscription.status === 'free' && !locked}
                        highlighted={item.id === 'pilot'}
                        onSelect={() => void navigate('/app/billing/checkout')}
                      />
                    ))}
                  </div>
                </>
              )}
              {mode === 'checkout' && (
                <>
                  <h2>Оформление подписки</h2>
                  <div className={styles.columns}>
                    <section className={styles.card}>
                      <h3>{plan.name}</h3>
                      <p>{plan.description}</p>
                      <strong>{data.trialUsed ? money(plan.price) : '0 ₽'} сегодня</strong>
                      <p>
                        {data.trialUsed
                          ? 'Пробный период уже использован.'
                          : `Первые ${plan.trialDays} дней бесплатно.`}
                      </p>
                      <p>
                        Далее {money(plan.price)} {plan.period}. Автопродление можно отключить.
                      </p>
                      <p>{plan.credits} ИИ-кредитов / месяц</p>
                      <Link to="/app/billing">Вернуться к тарифам</Link>
                    </section>
                    <section className={styles.card}>
                      <h3>Способ оплаты</h3>
                      <p>
                        Реальная оплата пока недоступна. В демонстрации проверяется только путь
                        оформления подписки.
                      </p>
                      <p>
                        После подключения оплаты данные карты будут вводиться на стороне платёжного
                        провайдера.
                      </p>
                      <Button
                        disabled={locked || data.subscription.status !== 'free'}
                        loading={busy}
                        onClick={() => {
                          void startCheckout();
                        }}
                      >
                        Создать тестовую оплату
                      </Button>
                    </section>
                  </div>
                </>
              )}
              {mode === 'return' && (
                <section className={styles.card}>
                  {!returnMatches ? (
                    <>
                      <h2>Оплата не найдена</h2>
                      <p>
                        По этой ссылке нет операции в вашем аккаунте. Параметры адреса не
                        подтверждают оплату.
                      </p>
                    </>
                  ) : (
                    <>
                      <h2>
                        {checkout.status === 'processing'
                          ? 'Платёж обрабатывается'
                          : checkout.status === 'succeeded'
                            ? 'Тестовая оплата подтверждена'
                            : checkout.status === 'failed'
                              ? 'Оплата не прошла'
                              : 'Оплата отменена'}
                      </h2>
                      <p role="status">
                        {checkout.status === 'processing'
                          ? 'Ждём подтверждения. Тариф пока не изменён. Повторно создавать оплату не нужно.'
                          : checkout.status === 'succeeded'
                            ? 'Результат получен от демонстрационного сервера. Состояние подписки показано ниже.'
                            : 'Подписка не подключена. Вы можете вернуться к тарифам и попробовать снова.'}
                      </p>
                      {env.enableMocks && checkout.status === 'processing' && (
                        <fieldset className={styles.simulator} disabled={locked}>
                          <legend>Имитация ответа платёжного провайдера</legend>
                          <div className={styles.actions}>
                            <Button
                              onClick={() =>
                                void act((signal) =>
                                  simulatePayment(checkout.id, 'succeeded', signal),
                                )
                              }
                            >
                              Смоделировать подтверждение
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() =>
                                void act((signal) => simulatePayment(checkout.id, 'failed', signal))
                              }
                            >
                              Смоделировать отказ
                            </Button>
                            <Button
                              variant="neutral"
                              onClick={() =>
                                void act((signal) =>
                                  simulatePayment(checkout.id, 'cancelled', signal),
                                )
                              }
                            >
                              Отменить тестовую оплату
                            </Button>
                          </div>
                        </fieldset>
                      )}
                    </>
                  )}
                  <Link to="/app/billing">Вернуться к тарифам</Link>
                </section>
              )}
              <section className={styles.card} aria-labelledby="subscription-heading">
                <h2 id="subscription-heading">Моя подписка</h2>
                <p>{data.plans.find((p) => p.id === data.subscription.planId)?.name}</p>
                <p role="status">
                  {data.subscription.status === 'free'
                    ? 'Бесплатный доступ'
                    : data.subscription.status === 'cancel_at_period_end'
                      ? 'Автопродление отключено'
                      : data.subscription.status === 'trialing'
                        ? 'Пробный период'
                        : 'Подписка активна'}
                </p>
                {data.subscription.periodEnd && (
                  <p>
                    Доступ до {date(data.subscription.periodEnd)}.{' '}
                    {data.subscription.autoRenew
                      ? `Следующее тестовое списание: ${money(plan.price)}.`
                      : 'Следующее списание отменено; после окончания периода — бесплатный тариф.'}
                  </p>
                )}
                {data.subscription.status !== 'free' &&
                  (confirmCancel ? (
                    <div className={styles.notice}>
                      <p>Отключить автопродление? Текущий доступ сохранится до конца периода.</p>
                      <div className={styles.actions}>
                        <Button
                          disabled={locked}
                          onClick={() =>
                            void act((signal) => setAutoRenew(false, data.version, signal))
                          }
                        >
                          Подтвердить отключение
                        </Button>
                        <Button
                          variant="neutral"
                          disabled={busy}
                          onClick={() => setConfirmCancel(false)}
                        >
                          Оставить подписку
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      disabled={locked}
                      onClick={() =>
                        data.subscription.autoRenew
                          ? setConfirmCancel(true)
                          : void act((signal) => setAutoRenew(true, data.version, signal))
                      }
                    >
                      {data.subscription.autoRenew
                        ? 'Отключить автопродление'
                        : 'Возобновить подписку'}
                    </Button>
                  ))}
                {checkout?.status === 'processing' && mode !== 'return' && (
                  <Link to={`/app/billing/return?checkout=${encodeURIComponent(checkout.id)}`}>
                    Проверить незавершённую оплату
                  </Link>
                )}
              </section>
              <section className={styles.card}>
                <h2>Лимиты ИИ-помощника</h2>
                <p>
                  Доступно {data.credits.balance} из {data.credits.limit} ИИ-кредитов.
                </p>
                <progress
                  aria-label="Остаток ИИ-кредитов"
                  value={data.credits.balance}
                  max={data.credits.limit}
                />
                <p>
                  В демонстрации лимит показывает состояние тестовой подписки. Реальный учёт расхода
                  и права доступа ещё не подключены.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </Workspace>
  );
}
