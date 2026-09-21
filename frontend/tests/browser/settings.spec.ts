import { expect, test, type Page } from '@playwright/test';

async function openSettings(page: Page) {
  await page.goto('/app/settings');
  await page.getByLabel('Email', { exact: true }).fill('student@example.test');
  await page.getByLabel('Пароль', { exact: true }).fill('Repeat123');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/settings$/);
  await expect(page.getByLabel('Как вас называть')).toBeVisible();
}

test('profile persists and unsaved changes can be discarded without overflow', async ({
  page,
}, testInfo) => {
  await openSettings(page);
  await page.getByLabel('Как вас называть').fill('Мария Настройки');
  await page.getByLabel('Имя на дипломе').fill('Мария Смирнова');
  await page.getByLabel('Часовой пояс', { exact: true }).selectOption('Asia/Barnaul');
  await page.getByLabel('Интерактивные материалы', { exact: true }).check();
  await page.getByLabel('Еженедельное напоминание об обучении').check();
  await page.getByRole('button', { name: 'Сохранить изменения', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Изменения сохранены.');
  await page.reload();
  await expect(page.getByLabel('Как вас называть')).toHaveValue('Мария Настройки');
  await expect(page.getByLabel('Имя на дипломе')).toHaveValue('Мария Смирнова');
  await expect(page.getByLabel('Часовой пояс', { exact: true })).toHaveValue('Asia/Barnaul');
  await expect(page.getByLabel('Интерактивные материалы', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Еженедельное напоминание об обучении')).toBeChecked();
  await page.getByLabel('Как вас называть').fill('Не сохранять');
  await page.getByRole('button', { name: 'Отменить изменения' }).click();
  await expect(page.getByLabel('Как вас называть')).toHaveValue('Мария Настройки');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (['chromium', 'narrow-chromium'].includes(testInfo.project.name)) {
    await page.screenshot({
      path: `../docs/qa/stage9-settings-${testInfo.project.name}.png`,
      fullPage: true,
    });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: `../docs/qa/stage9-settings-${testInfo.project.name}-text200.png`,
      fullPage: true,
    });
  }
});

test('conflicting update preserves draft and requires explicit reload', async ({ page }) => {
  await openSettings(page);
  await page.getByLabel('Как вас называть').fill('Мой черновик');
  await page.evaluate(() => {
    const key = 'repeat-preview-profile';
    const current = JSON.parse(sessionStorage.getItem(key)!);
    sessionStorage.setItem(
      key,
      JSON.stringify({ ...current, displayName: 'Другая вкладка', version: current.version + 1 }),
    );
  });
  await page.getByRole('button', { name: 'Сохранить изменения', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Профиль изменился');
  await expect(page.getByLabel('Как вас называть')).toHaveValue('Мой черновик');
  await expect(
    page.getByRole('button', { name: 'Сохранить изменения', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Загрузить профиль и заменить изменения' }).click();
  await expect(page.getByLabel('Как вас называть')).toHaveValue('Другая вкладка');
  await page.getByLabel('Как вас называть').fill('После обновления');
  await page.getByRole('button', { name: 'Сохранить изменения', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Изменения сохранены.');
});

test('expired session cannot save profile', async ({ page }) => {
  await openSettings(page);
  await page.getByLabel('Как вас называть').fill('Не сохранять');
  await page.evaluate(() => sessionStorage.setItem('repeat-preview-profile-response', 'expired'));
  await page.getByRole('button', { name: 'Сохранить изменения', exact: true }).click();
  await expect(page).toHaveURL(/auth\/login/);
  await expect(page.getByLabel('Как вас называть')).toHaveCount(0);
});

test('lost save response reconciles persisted profile without resubmitting', async ({ page }) => {
  await openSettings(page);
  await page.getByLabel('Как вас называть').fill('Сохранено без ответа');
  await page.evaluate(() => sessionStorage.setItem('repeat-preview-profile-response', 'lost'));
  await page.getByRole('button', { name: 'Сохранить изменения', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Не удалось подтвердить сохранение');
  await expect(page.getByLabel('Как вас называть')).toHaveValue('Сохранено без ответа');
  await page.getByRole('button', { name: 'Загрузить профиль и заменить изменения' }).click();
  await expect(page.getByRole('status')).toHaveText('Актуальный профиль загружен.');
  await expect(page.getByLabel('Как вас называть')).toHaveValue('Сохранено без ответа');
  expect(
    await page.evaluate(
      () => JSON.parse(sessionStorage.getItem('repeat-preview-profile')!).version,
    ),
  ).toBe(2);
});
