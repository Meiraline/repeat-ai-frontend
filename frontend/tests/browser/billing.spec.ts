import { expect, test, type Page } from '@playwright/test';
async function open(page: Page, path = '/app/billing') {
  await page.goto(path);
  await page.getByLabel('Email', { exact: true }).fill('student@example.test');
  await page.getByLabel('Пароль', { exact: true }).fill('Repeat123');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Моя подписка' })).toBeVisible();
}
async function start(page: Page) {
  await page.getByRole('button', { name: 'Выбрать Пилот' }).click();
  await page.getByRole('button', { name: 'Создать тестовую оплату' }).click();
  await expect(page.getByRole('heading', { name: 'Платёж обрабатывается' })).toBeVisible();
}
test('checkout waits for confirmation; cancellation and resume preserve the paid period', async ({
  page,
}, info) => {
  await open(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (['chromium', 'narrow-chromium'].includes(info.project.name))
    await page.screenshot({
      path: `../docs/qa/stage9-billing-${info.project.name}.png`,
      fullPage: true,
    });
  await start(page);
  if (['chromium', 'narrow-chromium'].includes(info.project.name)) {
    await page.screenshot({
      path: `../docs/qa/stage9-billing-return-${info.project.name}.png`,
      fullPage: true,
    });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: `../docs/qa/stage9-billing-return-${info.project.name}-text200.png`,
      fullPage: true,
    });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '';
    });
  }

  await expect(page.getByText('Бесплатный доступ', { exact: true })).toBeVisible();
  const checkout = new URL(page.url()).searchParams.get('checkout');
  await page.goto(`/app/billing/return?checkout=${checkout}&success=true&status=succeeded`);
  await expect(page.getByRole('heading', { name: 'Платёж обрабатывается' })).toBeVisible();
  await page.getByRole('button', { name: 'Смоделировать подтверждение' }).click();
  await expect(page.getByText('Пробный период', { exact: true })).toBeVisible();
  await expect(page.getByText('Доступно 600 из 600 ИИ-кредитов.')).toBeVisible();
  await page.getByRole('button', { name: 'Отключить автопродление', exact: true }).click();
  await page.getByRole('button', { name: 'Подтвердить отключение' }).click();
  await expect(page.getByText('Автопродление отключено', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Автопродление отключено', { exact: true })).toBeVisible();
  await expect(page.getByText('Доступно 600 из 600 ИИ-кредитов.')).toBeVisible();
  await page.getByRole('button', { name: 'Возобновить подписку' }).click();
  await expect(page.getByText('Пробный период', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('mock server rejects foreign operations and stale versions, expires cancelled access and prevents a second trial', async ({
  page,
}) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const base = '/api/v1/__preview/billing';
    async function send(
      path: string,
      method: string,
      body?: unknown,
      headers: Record<string, string> = {},
    ) {
      const response = await fetch(base + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { status: response.status, payload: await response.json() };
    }
    const one = await send('/checkout', 'POST', { planId: 'pilot' }, { 'Idempotency-Key': 'one' });
    const again = await send(
      '/checkout',
      'POST',
      { planId: 'pilot' },
      { 'Idempotency-Key': 'one' },
    );
    const id = one.payload.data.checkout.id;
    const identity = sessionStorage.getItem('repeat-preview-identity')!;
    sessionStorage.setItem('repeat-preview-identity', 'another@example.test');
    const foreign = await send(`/checkout/${id}/simulate`, 'POST', { outcome: 'succeeded' });
    const other = await send('', 'GET');
    sessionStorage.setItem('repeat-preview-identity', identity);
    const success = await send(`/checkout/${id}/simulate`, 'POST', { outcome: 'succeeded' });
    const duplicate = await send(`/checkout/${id}/simulate`, 'POST', { outcome: 'succeeded' });
    const stale = await send('/subscription', 'PUT', { autoRenew: false }, { 'If-Match': '1' });
    const cancel = await send(
      '/subscription',
      'PUT',
      { autoRenew: false },
      { 'If-Match': String(success.payload.data.version) },
    );
    const storageKey = `repeat-preview-billing:${identity}`;
    const stored = JSON.parse(sessionStorage.getItem(storageKey)!);
    stored.billing.subscription.periodEnd = new Date(Date.now() - 1000).toISOString();
    sessionStorage.setItem(storageKey, JSON.stringify(stored));
    const expired = await send('', 'GET');
    const second = await send(
      '/checkout',
      'POST',
      { planId: 'pilot' },
      { 'Idempotency-Key': 'two' },
    );
    const paid = await send(`/checkout/${second.payload.data.checkout.id}/simulate`, 'POST', {
      outcome: 'succeeded',
    });
    sessionStorage.removeItem('repeat-preview-session');
    const unauthorized = await send('', 'GET');
    return {
      same: id === again.payload.data.checkout.id,
      foreign: foreign.status,
      other: other.payload.data.subscription.status,
      duplicateVersion: duplicate.payload.data.version === success.payload.data.version,
      stale: stale.status,
      cancelled: cancel.payload.data.subscription.status,
      expired: expired.payload.data.subscription.status,
      secondStatus: paid.payload.data.subscription.status,
      unauthorized: unauthorized.status,
    };
  });
  expect(result).toEqual({
    same: true,
    foreign: 404,
    other: 'free',
    duplicateVersion: true,
    stale: 409,
    cancelled: 'cancel_at_period_end',
    expired: 'free',
    secondStatus: 'active',
    unauthorized: 401,
  });
});
test('forged return and declined checkout never activate a subscription', async ({ page }) => {
  await open(page, '/app/billing/return?success=true&checkout=another-account');
  await expect(page.getByRole('heading', { name: 'Оплата не найдена' })).toBeVisible();
  await expect(page.getByText('Бесплатный доступ', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Вернуться к тарифам' }).click();
  await start(page);
  await page.getByRole('button', { name: 'Смоделировать отказ' }).click();
  await expect(page.getByRole('heading', { name: 'Оплата не прошла' })).toBeVisible();
  await expect(page.getByText('Бесплатный доступ', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Вернуться к тарифам' }).click();
  await start(page);
  await page.getByRole('button', { name: 'Отменить тестовую оплату' }).click();
  await expect(page.getByRole('heading', { name: 'Оплата отменена' })).toBeVisible();
  await expect(page.getByText('Бесплатный доступ', { exact: true })).toBeVisible();
});
test('lost checkout response is reconciled instead of creating another payment', async ({
  page,
}) => {
  await open(page);
  await page.getByRole('button', { name: 'Выбрать Пилот' }).click();
  await page.evaluate(() => sessionStorage.setItem('repeat-preview-billing-response', 'lost'));
  await page.getByRole('button', { name: 'Создать тестовую оплату' }).click();
  await expect(page.getByRole('alert')).toContainText('Не удалось подтвердить изменение');
  await expect(page.getByRole('button', { name: 'Создать тестовую оплату' })).toBeDisabled();
  await page.getByRole('button', { name: 'Обновить статус' }).click();
  const link = page.getByRole('link', { name: 'Проверить незавершённую оплату' });
  await expect(link).toBeVisible();
  const href = await link.getAttribute('href');
  await page.getByRole('button', { name: 'Создать тестовую оплату' }).click();
  await expect(page).toHaveURL(new RegExp(href!.replace('?', '\\?')));
  await page.getByRole('button', { name: 'Смоделировать подтверждение' }).click();
  await expect(page.getByText('Пробный период', { exact: true })).toBeVisible();
  await page.evaluate(() => sessionStorage.setItem('repeat-preview-billing-response', 'lost'));
  await page.getByRole('button', { name: 'Отключить автопродление', exact: true }).click();
  await page.getByRole('button', { name: 'Подтвердить отключение' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: 'Обновить статус' }).click();
  await expect(page.getByText('Автопродление отключено', { exact: true })).toBeVisible();
});
