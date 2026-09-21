import { expect, test, type Page } from '@playwright/test';
async function openSettings(page: Page) {
  await page.goto('/app/settings');
  await page.getByLabel('Email', { exact: true }).fill('student@example.test');
  await page.getByLabel('Пароль', { exact: true }).fill('Repeat123');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByLabel('Размер текста', { exact: true })).toBeVisible();
}
test('device accessibility applies, persists, follows navigation and resets', async ({
  page,
}, info) => {
  await openSettings(page);
  await page.getByLabel('Размер текста', { exact: true }).selectOption('200');
  await page.getByLabel('Уменьшить движение', { exact: true }).check();
  await page.getByRole('button', { name: 'Отменить доступность', exact: true }).click();
  await expect(page.getByLabel('Размер текста', { exact: true })).toHaveValue('100');
  await page.getByLabel('Размер текста', { exact: true }).selectOption('200');
  await page.getByLabel('Уменьшить движение', { exact: true }).check();
  await page.getByRole('button', { name: 'Применить доступность', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-text-size', '200');
  await expect(page.locator('html')).toHaveCSS('font-size', '32px');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (['chromium', 'narrow-chromium'].includes(info.project.name)) {
    await page.locator('#accessibility').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `../docs/qa/stage9-accessibility-${info.project.name}.png` });
  }
  await page.reload();
  await expect(page.getByLabel('Размер текста', { exact: true })).toHaveValue('200');
  await expect(page.getByLabel('Уменьшить движение', { exact: true })).toBeChecked();
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-text-size', '200');
  await expect(page.locator('html')).toHaveAttribute('data-reduce-motion', 'true');
  await page.goto('/app/settings');
  await page.getByRole('button', { name: 'Сбросить доступность', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-text-size', '100');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(
    page.getByText('В вашей системе уменьшение движения уже включено', { exact: false }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator('html')
        .evaluate((element) => Number.parseFloat(getComputedStyle(element).animationDuration)),
    )
    .toBe(0.00001);
});
test('storage failure is explicit and does not block applying settings', async ({ page }) => {
  await openSettings(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'repeat-device-accessibility-v1')
        throw new DOMException('Blocked', 'SecurityError');
      return original.call(this, key, value);
    };
  });
  await page.getByLabel('Размер текста', { exact: true }).selectOption('125');
  await page.getByRole('button', { name: 'Применить доступность', exact: true }).click();
  await expect(page.getByText('Браузер не разрешил сохранить', { exact: false })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-text-size', '125');
});
