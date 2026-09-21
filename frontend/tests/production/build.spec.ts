import { expect, test } from '@playwright/test';
test('SEO HTML exists without JavaScript; private route hydrates without mocks', async ({
  request,
  page,
}) => {
  const response = await request.get('/');
  expect(await response.text()).toContain('Ваш путь к новым знаниям');
  expect((await request.get('/mockServiceWorker.js')).status()).toBe(404);
  await page.goto('/app');
  await expect(page.getByRole('heading', { name: 'Не удалось проверить сессию' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible();
  expect(
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length),
  ).toBe(0);
  expect((await request.get('/unknown')).status()).toBe(404);
  expect((await request.get('/app/plans/new')).status()).toBe(200);
  expect((await request.get('/app/plans/preview-id')).status()).toBe(200);
  expect((await request.get('/app/plans/preview-id/review')).status()).toBe(200);
  for (const path of [
    '/app/knowledge',
    '/app/tutor',
    '/app/diplomas',
    '/app/settings',
    '/app/billing',
    '/app/billing/checkout',
    '/app/billing/return',
    '/app/tracks/track-id/exam/topic-id',
    '/app/tracks/track-id/project',
    '/app/tracks/track-id/diploma',
    '/app/tracks/track-id/tutor',
    '/app/tracks/track-id',
    '/app/tracks/track-id/topics/topic-id',
    '/app/tracks/track-id/knowledge',
  ])
    expect((await request.get(path)).status()).toBe(200);
});

test('landing navigation and FAQ work with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Научись чему угодно');
  await page
    .getByRole('navigation', { name: 'Основная навигация' })
    .getByRole('link', { name: 'Вопросы' })
    .click();
  await page.locator('summary').filter({ hasText: 'Когда стартует пилот?' }).click();
  await expect(page.getByText('Дата запуска ещё не объявлена.', { exact: false })).toBeVisible();
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Репит/);
  await expect(page.getByRole('link', { name: 'Создать мой план', exact: true })).toHaveAttribute(
    'href',
    '/app/plans/new',
  );
  await context.close();
});
