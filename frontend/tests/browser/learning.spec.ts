import { start } from './helpers/start-learning';
import { expect, test, type Page } from '@playwright/test';
test.setTimeout(60000);
async function lesson(page: Page) {
  await page.getByRole('button', { name: 'Открыть тему', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Материалы', exact: true })).toBeVisible();
}
async function checkMaterial(page: Page, name: string) {
  await page.getByLabel(`Изучено: ${name}`, { exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Подтвердить изучение' })
    .getByRole('button', { name: 'Подтвердить изучение', exact: true })
    .click();
}
test('material progress persists, can be undone and never bypasses exam gating', async ({
  page,
}) => {
  const id = await start(page);
  await page.getByRole('button', { name: 'Условия открытия' }).first().click();
  await expect(page.getByRole('dialog')).toContainText('контрольную точку');
  await page.keyboard.press('Escape');
  await lesson(page);
  await page.getByText('Демонстрационный конспект', { exact: true }).click();
  await checkMaterial(page, 'Демонстрационный конспект');
  await expect(
    page.getByLabel('Изучено: Демонстрационный конспект', { exact: true }),
  ).toBeChecked();
  await page.reload();
  await expect(
    page.getByLabel('Изучено: Демонстрационный конспект', { exact: true }),
  ).toBeChecked();
  await checkMaterial(page, 'Самостоятельная практика');
  await expect(page.getByText('Готово к контрольной точке · 100%')).toBeVisible();
  await page.getByLabel('Изучено: Самостоятельная практика', { exact: true }).click();
  await expect(page.getByText('В процессе · 50%')).toBeVisible();
  await page.getByRole('link', { name: 'Вернуться к карте курса' }).click();
  await expect(page.getByRole('button', { name: 'Условия открытия' })).toHaveCount(2);
  await page.goto(`/app/tracks/${id}/topics/2`);
  await expect(page.getByRole('heading', { name: 'Тема пока закрыта' })).toBeVisible();
  const status = await page.evaluate(
    async (id) =>
      (
        await fetch(`/api/v1/__preview/tracks/${id}/topics/2/materials/2-notes`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
          body: JSON.stringify({ completed: true, expectedVersion: 1 }),
        })
      ).status,
    id,
  );
  expect(status).toBe(403);
});
test('lost completion response is retried once and stale material version requires refresh', async ({
  page,
}) => {
  const id = await start(page);
  await lesson(page);
  await page.evaluate(() =>
    sessionStorage.setItem('repeat-preview-learning-response', 'materials'),
  );
  await checkMaterial(page, 'Демонстрационный конспект');
  await expect(page.getByRole('alert')).toContainText('Ответ потерян');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Подтвердить изучение', exact: true })
    .click();
  await expect(
    page.getByLabel('Изучено: Демонстрационный конспект', { exact: true }),
  ).toBeChecked();
  expect(
    await page.evaluate(
      (id) =>
        JSON.parse(sessionStorage.getItem('repeat-preview-learning:student@example.test')!)[id]
          .lessons['1'].materials[0].version,
      id,
    ),
  ).toBe(2);
  await page.evaluate((id) => {
    const k = 'repeat-preview-learning:student@example.test',
      db = JSON.parse(sessionStorage.getItem(k)!);
    db[id].lessons['1'].materials[0].version++;
    sessionStorage.setItem(k, JSON.stringify(db));
  }, id);
  await page.getByLabel('Изучено: Демонстрационный конспект', { exact: true }).click();
  await page.getByRole('button', { name: 'Загрузить сохранённый прогресс' }).click();
  await expect(
    page.getByLabel('Изучено: Демонстрационный конспект', { exact: true }),
  ).toBeChecked();
});
test('knowledge search survives detail and reload; self-check stays separate from learning progress', async ({
  page,
}) => {
  const id = await start(page);
  await page.getByRole('link', { name: 'База знаний курса', exact: true }).click();
  await page.getByLabel('Поиск в базе знаний').fill('Основы');
  await expect(page.getByRole('button', { name: 'Открыть запись' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Открыть запись' }).click();
  await expect(page.getByRole('button', { name: 'Знаю', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Показать ответ' }).click();
  await page.getByRole('button', { name: 'Знаю', exact: true }).click();
  await expect(page.getByText('Моя отметка: Знаю')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Показать ответ' }).click();
  await expect(page.getByText('Моя отметка: Знаю')).toBeVisible();
  await page.getByRole('button', { name: 'К списку записей' }).click();
  await expect(page.getByLabel('Поиск в базе знаний')).toHaveValue('Основы');
  await page.getByLabel('Раздел', { exact: true }).selectOption('source');
  await expect(page.getByRole('heading', { name: 'Записи не найдены' })).toBeVisible();
  await page.goto(`/app/tracks/${id}`);
  await expect(page.getByText(/Изучено материалов: 0%/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Условия открытия' })).toHaveCount(2);
});
test('narrow roadmap and rich lesson content fit with 200 percent text', async ({ page }) => {
  const id = await start(page);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.getByRole('link', { name: 'Карта курса', exact: true }).waitFor();
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Список', exact: true }).click();
  await page.getByLabel('Найти тему').fill('Основы');
  await page.reload();
  await expect(page.getByLabel('Найти тему')).toHaveValue('Основы');
  await lesson(page);
  await page.evaluate((id) => {
    const k = 'repeat-preview-learning:student@example.test',
      db = JSON.parse(sessionStorage.getItem(k)!);
    db[id].lessons['1'].materials[0].blocks.push(
      { type: 'code', language: 'Text', text: 'VeryLongCode'.repeat(100) },
      {
        type: 'table',
        headers: ['Column', 'Details'],
        rows: [['Title', 'LongUnbrokenValue'.repeat(30)]],
      },
    );
    sessionStorage.setItem(k, JSON.stringify(db));
  }, id);
  await page.reload();
  await page.getByRole('heading', { name: 'Материалы', exact: true }).waitFor();
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  await page.getByText('Демонстрационный конспект', { exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'Начать самопроверку' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('self-check retries lost response and recovers version conflict without changing topic access', async ({
  page,
}) => {
  const id = await start(page);
  await page.getByRole('link', { name: 'База знаний курса', exact: true }).click();
  await page.getByRole('button', { name: 'Открыть запись' }).first().click();
  await page.getByRole('button', { name: 'Показать ответ' }).click();
  await page.evaluate(() =>
    sessionStorage.setItem('repeat-preview-learning-response', 'knowledge'),
  );
  await page.getByRole('button', { name: 'Нужно повторить', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Ответ потерян');
  await page.getByRole('button', { name: 'Нужно повторить', exact: true }).click();
  await expect(page.getByText('Моя отметка: Повторить')).toBeVisible();
  expect(
    await page.evaluate(
      (id) =>
        JSON.parse(sessionStorage.getItem('repeat-preview-learning:student@example.test')!)[id]
          .knowledge.entries[0].version,
      id,
    ),
  ).toBe(2);
  await page.evaluate((id) => {
    const k = 'repeat-preview-learning:student@example.test',
      db = JSON.parse(sessionStorage.getItem(k)!);
    db[id].knowledge.entries[0].version++;
    sessionStorage.setItem(k, JSON.stringify(db));
  }, id);
  await page.getByRole('button', { name: 'Знаю', exact: true }).click();
  await page.getByRole('button', { name: 'Обновить базу знаний' }).click();
  await expect(page.getByText('Моя отметка: Повторить')).toBeVisible();
  await page.getByRole('button', { name: 'Знаю', exact: true }).click();
  await expect(page.getByText('Моя отметка: Знаю')).toBeVisible();
});
