import { expect, test } from '@playwright/test';
const story = (name: string) =>
  `/iframe.html?id=design-system-auth-foundations--${name}&viewMode=story`;
test('keyboard input, password reveal and associated validation error', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(story('auth-composition'));
  await expect(page.getByLabel('Email')).toBeVisible();
  await page.bringToFront();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Email')).toBeFocused();
  await page.keyboard.type('learner@example.test');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Пароль', { exact: true })).toBeFocused();
  await page.keyboard.type('example-password');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Показать пароль' })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByLabel('Пароль', { exact: true })).toHaveAttribute('type', 'text');
  await expect(page.getByLabel('Пароль', { exact: true })).toHaveValue('example-password');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Email')).toHaveAccessibleDescription(
    'Укажите корректный адрес электронной почты.',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
test('consent, disabled/loading controls, long text and 200% font size', async ({ page }) => {
  await page.goto(story('states'));
  const consent = page.getByRole('checkbox', { name: /Я принимаю/ }).first();
  await consent.check();
  await expect(consent).toBeChecked();
  await page.getByRole('link', { name: 'условия использования' }).first().click();
  await expect(consent).toBeChecked();
  await expect(page.getByRole('button', { name: 'Недоступно' })).toBeDisabled();
  await expect(page.getByRole('button', { name: /Сохраняем/ })).toBeDisabled();
  await page.addStyleTag({ content: 'html { font-size: 200%; }' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page
    .getByLabel('Очень длинная подпись поля для проверки переноса текста при увеличении масштаба')
    .fill('Текст остаётся доступным');
  await expect(page.getByRole('button', { name: 'Показать пароль' })).toBeVisible();
});
test('reduced motion stops the loading animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/iframe.html?id=atoms-spinner--default&viewMode=story');
  const loading = page.getByRole('status');
  await expect(loading).toBeVisible();
  expect(
    await loading
      .locator('> span')
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
});
