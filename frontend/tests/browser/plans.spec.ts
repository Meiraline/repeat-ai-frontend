import { expect, test, type Page } from '@playwright/test';
test.setTimeout(60000);
async function login(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel('Email', { exact: true }).fill('student@example.test');
  await page.getByLabel('Пароль', { exact: true }).fill('Repeat123');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Начните с первого курса' })).toBeVisible();
}
async function start(page: Page) {
  await login(page);
  await page.getByRole('button', { name: 'Создать первый курс', exact: true }).click();
  await page.getByRole('button', { name: 'Начать интервью', exact: true }).click();
  await expect(page.getByLabel('Ваш ответ', { exact: true })).toBeVisible();
}
const answers = [
  'Аналитика данных',
  'Собрать три рабочих дашборда',
  'Начальный уровень',
  '2099-12-31',
  '4',
  'Видео, статьи, практика',
  'Только открытые материалы',
];
async function answer(page: Page, value: string) {
  await page.getByLabel('Ваш ответ', { exact: true }).fill(value);
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
}
async function summary(page: Page) {
  await start(page);
  for (let i = 0; i < answers.length; i++) {
    await expect(page.getByText(`Вопрос ${i + 1} из 7`, { exact: true })).toBeVisible();
    await answer(page, answers[i]!);
  }
  await expect(
    page.getByRole('heading', { name: 'Срок требует решения', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Продолжить к сводке' })).toBeDisabled();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Продолжить к сводке' }).click();
  await expect(page.getByRole('button', { name: 'Составить программу' })).toBeVisible();
}
test('saved interview resumes, detects version conflict and keeps the current answer', async ({
  page,
}) => {
  await start(page);
  await answer(page, answers[0]!);
  await expect(page.getByText('Вопрос 2 из 7', { exact: true })).toBeVisible();
  const value = 'Очень длинная цель '.repeat(40);
  await page.getByLabel('Ваш ответ').fill(value);
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.getByLabel('Ваш ответ')).toHaveValue(value);
    expect(
      await page.locator('header h1').evaluate((e) => e.getBoundingClientRect().height),
    ).toBeLessThan(100);
  }
  await page.evaluate(() => {
    const key = 'repeat-preview-plans:student@example.test';
    const db = JSON.parse(sessionStorage.getItem(key)!);
    db.drafts[0].version++;
    sessionStorage.setItem(key, JSON.stringify(db));
  });
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Загрузить сохранённую версию' })).toBeVisible();
  await expect(page.getByLabel('Ваш ответ')).toHaveValue(value);
  await page.getByRole('button', { name: 'Загрузить сохранённую версию' }).click();
  await expect(page.getByRole('button', { name: 'Загрузить сохранённую версию' })).toHaveCount(0);
  await expect(page.getByLabel('Ваш ответ')).toHaveValue(value);
  await page.getByRole('button', { name: 'Сохранить и выйти' }).click();
  await expect(page.getByRole('heading', { name: 'Черновики планов' })).toBeVisible();
  await page.getByRole('link', { name: 'Продолжить интервью' }).click();
  await expect(page.getByLabel('Ваш ответ')).toHaveValue(value);
  await page.reload();
  await expect(page.getByLabel('Ваш ответ')).toHaveValue(value);
});
test('generation restores after refresh, is idempotent and stops polling on completion', async ({
  page,
}) => {
  await summary(page);
  await page.getByRole('button', { name: 'Составить программу' }).click();
  await expect(page.getByRole('heading', { name: 'Создаём учебный план' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Черновик плана готов' })).toBeVisible({
    timeout: 15000,
  });
  expect(
    await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem('repeat-preview-plans:student@example.test')!).jobs
          .length,
    ),
  ).toBe(1);
  let polls = 0;
  page.on('request', (r) => {
    if (r.url().includes('/__preview/jobs/')) polls++;
  });
  await page.waitForTimeout(2200);
  expect(polls).toBe(0);
  await page.getByRole('link', { name: 'В кабинет', exact: true }).click();
  await page.getByRole('link', { name: 'Открыть результат' }).click();
  await expect(page.getByRole('heading', { name: 'Черновик плана готов' })).toBeVisible();
});
test('partial result remains visible; explicit retry creates a new job', async ({ page }) => {
  await summary(page);
  await page.evaluate(() => sessionStorage.setItem('repeat-preview-generation', 'partial'));
  await page.getByRole('button', { name: 'Составить программу' }).click();
  await expect(page.getByRole('heading', { name: 'Получен частичный результат' })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByRole('region', { name: 'Черновик программы' })).toBeVisible();
  await page.evaluate(() => sessionStorage.setItem('repeat-preview-generation', 'success'));
  await page.getByRole('button', { name: 'Повторить генерацию' }).click();
  await expect(page.getByRole('heading', { name: 'Черновик плана готов' })).toBeVisible({
    timeout: 15000,
  });
  expect(
    await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem('repeat-preview-plans:student@example.test')!).jobs
          .length,
    ),
  ).toBe(2);
});
test('course filters persist in URL, calendar and mobile cards fit', async ({ page }) => {
  await login(page);
  await page.evaluate(() => sessionStorage.setItem('repeat-preview-dashboard', 'sample'));
  await page.reload();
  await expect(
    page.getByRole('region', { name: 'Учебные программы' }).getByRole('article'),
  ).toHaveCount(3);
  await page.getByRole('button', { name: 'Требуют внимания', exact: true }).click();
  await expect(page).toHaveURL(/filter=attention/);
  await expect(page.getByRole('article')).toHaveCount(1);
  await page.getByRole('button', { name: 'Завершённые', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('article')).toContainText('Основы презентаций');
  await page.getByRole('button', { name: 'Следующий месяц' }).click();
  await page.setViewportSize({ width: 320, height: 740 });
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  expect(
    await page.locator('header h1').evaluate((e) => e.getBoundingClientRect().width),
  ).toBeGreaterThan(200);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('lost start response reuses the key; delayed and failed jobs preserve the brief', async ({
  page,
}) => {
  await summary(page);
  await page.evaluate(() => {
    sessionStorage.setItem('repeat-preview-generation', 'slow');
    sessionStorage.setItem('repeat-preview-start-response', 'lost');
  });
  await page.getByRole('button', { name: 'Составить программу' }).click();
  await expect(page.getByRole('alert')).toContainText('Ответ потерян');
  await page.getByRole('button', { name: 'Составить программу' }).click();
  await expect(page.getByRole('heading', { name: 'Создаём учебный план' })).toBeVisible();
  await page.evaluate(() => {
    const key = 'repeat-preview-plans:student@example.test',
      db = JSON.parse(sessionStorage.getItem(key)!);
    db.jobs[0].startedAt = Date.now() - 20000;
    sessionStorage.setItem(key, JSON.stringify(db));
  });
  await expect(
    page.getByText('Это занимает больше времени, чем обычно.', { exact: false }),
  ).toBeVisible();
  await page.evaluate(() => {
    const key = 'repeat-preview-plans:student@example.test',
      db = JSON.parse(sessionStorage.getItem(key)!);
    db.jobs[0].scenario = 'failed';
    sessionStorage.setItem(key, JSON.stringify(db));
  });
  await expect(page.getByRole('heading', { name: 'Генерация не завершена' })).toBeVisible();
  expect(
    await page.evaluate(() => {
      const db = JSON.parse(sessionStorage.getItem('repeat-preview-plans:student@example.test')!);
      return { count: db.jobs.length, goal: db.drafts[0].brief.skill };
    }),
  ).toEqual({ count: 1, goal: 'Аналитика данных' });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Повторить генерацию' })).toBeVisible();
});
test('unsaved answer blocks navigation and Escape returns to the form', async ({ page }) => {
  await start(page);
  await page.getByLabel('Ваш ответ').fill('Несохранённый ответ');
  if (await page.getByRole('button', { name: 'Меню', exact: true }).isVisible())
    await page.getByRole('button', { name: 'Меню', exact: true }).click();
  await page
    .getByRole('link', { name: 'Мои курсы', exact: true })
    .filter({ visible: true })
    .click();
  await expect(page.getByRole('dialog', { name: 'Есть несохранённый ответ' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Ваш ответ')).toHaveValue('Несохранённый ответ');
  await page.getByRole('button', { name: 'Сохранить и выйти' }).click();
  await expect(page.getByRole('heading', { name: 'Черновики планов' })).toBeVisible();
});
