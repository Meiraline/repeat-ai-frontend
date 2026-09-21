import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { env } from '@/shared/config/env';
import type { Billing } from '@/features/billing';
import { mockAuthenticated, mockUnauthorized } from './auth';

// Draft contract. Prices/credits are examples from Figma, never production configuration.
const plans: Billing['plans'] = [
  {
    id: 'free',
    name: 'Бесплатный',
    description: 'Для знакомства с сервисом',
    price: 0,
    currency: 'RUB',
    period: 'навсегда',
    trialDays: 0,
    credits: 50,
    available: false,
    features: ['Базовые темы и демо-курсы', 'План обучения и прогресс', 'Базовые рекомендации'],
  },
  {
    id: 'pilot',
    name: 'Пилот',
    description: 'Полный учебный сценарий с ИИ',
    price: 990,
    currency: 'RUB',
    period: '/ месяц',
    trialDays: 7,
    credits: 600,
    available: true,
    features: [
      'Всё из бесплатного тарифа',
      'Полный доступ к курсам и тестам',
      'Практика и разбор ошибок с ИИ',
      'Сертификаты и достижения',
    ],
  },
  {
    id: 'author',
    name: 'Автор / эксперт',
    description: 'Для создания и публикации курсов',
    price: 2490,
    currency: 'RUB',
    period: '/ месяц',
    trialDays: 0,
    credits: 600,
    available: false,
    features: [
      'Всё из тарифа «Пилот»',
      'Создание собственных курсов',
      'Загрузка материалов',
      'Аналитика учеников',
      'Монетизация контента',
    ],
  },
];
type Stored = { billing: Billing; keys: Record<string, string>; paidStatus: 'active' | 'trialing' };
function key() {
  return `repeat-preview-billing:${sessionStorage.getItem('repeat-preview-identity')}`;
}
function read(): Stored {
  const raw = sessionStorage.getItem(key());
  return raw
    ? (JSON.parse(raw) as Stored)
    : {
        billing: {
          plans,
          version: 1,
          trialUsed: false,
          subscription: { planId: 'free', status: 'free', periodEnd: null, autoRenew: false },
          credits: { balance: 50, limit: 50 },
          checkout: null,
        },
        keys: {},
        paidStatus: 'trialing',
      };
}
function write(value: Stored) {
  sessionStorage.setItem(key(), JSON.stringify(value));
}
const ok = (data: Billing) => HttpResponse.json({ data });
const error = (message: string, status = 409) =>
  HttpResponse.json({ error: { code: 'BILLING_ERROR', message, retryable: false } }, { status });
function respond(state: Stored) {
  write(state);
  if (sessionStorage.getItem('repeat-preview-billing-response') === 'lost') {
    sessionStorage.removeItem('repeat-preview-billing-response');
    return HttpResponse.error();
  }
  return ok(state.billing);
}
export const billingHandlers = [
  http.get(`${env.apiBaseUrl}/__preview/billing`, () => {
    if (!mockAuthenticated()) return mockUnauthorized();
    const state = read();
    const subscription = state.billing.subscription;
    // Mock server owns expiry, never the page or a URL parameter.
    if (
      subscription.status === 'cancel_at_period_end' &&
      subscription.periodEnd &&
      Date.parse(subscription.periodEnd) <= Date.now()
    ) {
      state.billing.subscription = {
        planId: 'free',
        status: 'free',
        periodEnd: null,
        autoRenew: false,
      };
      state.billing.credits = { balance: 50, limit: 50 };
      state.billing.version++;
      write(state);
    }
    return ok(state.billing);
  }),
  http.post(`${env.apiBaseUrl}/__preview/billing/checkout`, async ({ request }) => {
    if (!mockAuthenticated()) return mockUnauthorized();
    const parsed = z.object({ planId: z.literal('pilot') }).safeParse(await request.json());
    const idempotency = request.headers.get('Idempotency-Key');
    if (!parsed.success || !idempotency || idempotency.length > 100)
      return error('Некорректный запрос.', 400);
    const state = read();
    if (Object.hasOwn(state.keys, idempotency)) return ok(state.billing);
    if (state.billing.subscription.status !== 'free')
      return error('Подписка уже подключена. Обновите её состояние.');
    if (state.billing.checkout?.status !== 'processing') {
      state.billing.checkout = { id: crypto.randomUUID(), status: 'processing' };
      state.billing.version++;
    }
    state.keys[idempotency] = state.billing.checkout.id;
    return respond(state);
  }),
  http.post(
    `${env.apiBaseUrl}/__preview/billing/checkout/:id/simulate`,
    async ({ request, params }) => {
      if (!mockAuthenticated()) return mockUnauthorized();
      const parsed = z
        .object({ outcome: z.enum(['succeeded', 'failed', 'cancelled']) })
        .safeParse(await request.json());
      if (!parsed.success) return error('Некорректный результат.', 400);
      const state = read(),
        checkout = state.billing.checkout;
      if (!checkout || checkout.id !== params.id) return error('Оплата не найдена.', 404);
      if (checkout.status !== 'processing') return ok(state.billing);
      checkout.status = parsed.data.outcome;
      state.billing.version++;
      if (checkout.status === 'succeeded') {
        const plan = plans.find((p) => p.id === 'pilot')!;
        const days = state.billing.trialUsed ? 30 : plan.trialDays;
        state.paidStatus = state.billing.trialUsed ? 'active' : 'trialing';
        state.billing.subscription = {
          planId: plan.id,
          status: state.paidStatus,
          periodEnd: new Date(Date.now() + days * 86400000).toISOString(),
          autoRenew: true,
        };
        state.billing.trialUsed = true;
        state.billing.credits = { balance: plan.credits, limit: plan.credits };
      }
      return respond(state);
    },
  ),
  http.put(`${env.apiBaseUrl}/__preview/billing/subscription`, async ({ request }) => {
    if (!mockAuthenticated()) return mockUnauthorized();
    const state = read();
    if (request.headers.get('If-Match') !== String(state.billing.version))
      return error('Состояние подписки изменилось. Обновите данные.');
    const parsed = z.object({ autoRenew: z.boolean() }).safeParse(await request.json());
    if (!parsed.success) return error('Некорректный запрос.', 400);
    const sub = state.billing.subscription;
    if (sub.status === 'free' || !sub.periodEnd || Date.parse(sub.periodEnd) <= Date.now())
      return error('Период подписки завершён. Обновите данные.');
    sub.autoRenew = parsed.data.autoRenew;
    sub.status = sub.autoRenew ? state.paidStatus : 'cancel_at_period_end';
    state.billing.version++;
    return respond(state);
  }),
];
