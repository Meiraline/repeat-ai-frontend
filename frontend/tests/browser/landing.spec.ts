import { expect, test } from '@playwright/test';
test('public navigation, keyboard FAQ and responsive text', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await page
    .getByRole('navigation', { name: 'Основная навигация' })
    .getByRole('link', { name: 'Вопросы' })
    .click();
  await expect(page).toHaveURL(/#faq$/);
  const question = page.locator('summary').filter({ hasText: 'Когда стартует пилот?' });
  await question.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Дата запуска ещё не объявлена.', { exact: false })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(
    page.getByText('Дата запуска ещё не объявлена.', { exact: false }),
  ).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '';
  });
  if (['chromium', 'narrow-chromium'].includes(info.project.name)) {
    for (const id of ['hero-title', 'trust', 'pricing', 'faq']) {
      await page.locator('#' + id).scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          page.locator('img:visible').evaluateAll((images) =>
            images
              .filter((image) => {
                const rect = image.getBoundingClientRect();
                return rect.bottom > 0 && rect.top < innerHeight;
              })
              .every(
                (image) =>
                  (image as HTMLImageElement).complete &&
                  (image as HTMLImageElement).naturalWidth > 0,
              ),
          ),
        )
        .toBe(true);
      await page.locator('img').evaluateAll(async (images) => {
        await Promise.all(
          images
            .filter((image) => {
              const rect = image.getBoundingClientRect();
              return rect.bottom > 0 && rect.top < innerHeight;
            })
            .map((image) => (image as HTMLImageElement).decode()),
        );
      });
      await page.screenshot({ path: `../docs/qa/stage9-landing-${info.project.name}-${id}.png` });
    }
  }
  await page.getByRole('link', { name: 'Создать мой план', exact: true }).click();
  await expect(page).toHaveURL(/auth\/login\?returnTo=%2Fapp%2Fplans%2Fnew/);
});
