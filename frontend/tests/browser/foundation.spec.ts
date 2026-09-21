import { expect, test } from '@playwright/test';
test('landing, navigation, direct refresh and narrow layout', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Научись чему угодно по персональному плану',
  );
  await page.getByRole('link', { name: 'Перейти к обучению' }).click();
  await expect(page).toHaveURL(/auth\/login/);
  await page.getByLabel('Email', { exact: true }).fill('student@example.test');
  await page.getByLabel('Пароль', { exact: true }).fill('Repeat123');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Начните с первого курса' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Начните с первого курса' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
test('unknown route and keyboard skip link', async ({ page }) => {
  await page.goto('/missing-route');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('не найдена');
  await page.bringToFront();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'К содержимому' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});
