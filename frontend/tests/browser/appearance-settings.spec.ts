import { expect, test, type Page } from '@playwright/test';
async function open(page: Page) {
  await page.goto('/app/settings');
  await page.getByLabel('Email', { exact: true }).fill('student@example.test');
  await page.getByLabel('Пароль', { exact: true }).fill('Repeat123');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Оформление', exact: true })).toBeVisible();
}
test('preview, keyboard selection, persistence and independent resets', async ({ page }, info) => {
  await open(page);
  await page.getByRole('radio', { name: 'Фиолетовый', exact: true }).check();
  await expect(page.getByRole('region', { name: 'Предпросмотр оформления' })).toHaveAttribute(
    'data-accent',
    'purple',
  );
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'blue');
  await page.getByRole('button', { name: 'Отменить оформление', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Синий', exact: true })).toBeChecked();
  await page.getByRole('radio', { name: 'Фиолетовый', exact: true }).focus();
  await page.keyboard.press('Space');
  await page.getByRole('button', { name: 'Применить оформление', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'purple');
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Фиолетовый', exact: true })).toBeChecked();
  await page.getByLabel('Размер текста', { exact: true }).selectOption('200');
  await page.getByRole('button', { name: 'Применить доступность', exact: true }).click();
  await page.getByRole('radio', { name: 'Зелёный', exact: true }).check();
  await page.getByRole('button', { name: 'Применить оформление', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-text-size', '200');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Сбросить доступность', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'green');
  await expect(page.locator('html')).toHaveAttribute('data-text-size', '100');
  if (['chromium', 'narrow-chromium'].includes(info.project.name)) {
    await page
      .locator('#appearance')
      .screenshot({ path: `../docs/qa/stage9-appearance-${info.project.name}.png` });
  }
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'green');
  await expect(page.getByRole('link', { name: 'Войти', exact: true })).toHaveCSS(
    'color',
    'rgb(7, 90, 59)',
  );
  await page.goto('/app/settings');
  await page.getByRole('button', { name: 'Сбросить оформление', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'blue');
});
test('blocked storage keeps an honest temporary state', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'repeat-device-accessibility-v1')
        throw new DOMException('Blocked', 'SecurityError');
      return original.call(this, key, value);
    };
  });
  await page.getByRole('radio', { name: 'Зелёный', exact: true }).check();
  await page.getByRole('button', { name: 'Применить оформление', exact: true }).click();
  await expect(
    page.getByText('Браузер не разрешил сохранить выбор.', { exact: false }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'green');
});
