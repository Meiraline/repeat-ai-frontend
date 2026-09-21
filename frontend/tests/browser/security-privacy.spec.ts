import { expect, test } from '@playwright/test';
test.setTimeout(60000);
async function openSettings(page: import('@playwright/test').Page) {
  await page.goto('/app/settings');
  await page.getByLabel('Email', { exact: true }).fill('student@example.test');
  await page.getByLabel('Пароль', { exact: true }).fill('Repeat123');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Настройки аккаунта', exact: true }),
  ).toBeVisible();
}
test('all-session logout supports cancel, server error and explicit retry', async ({
  page,
}, info) => {
  await openSettings(page);
  const trigger = page.getByRole('button', { name: 'Завершить все сессии', exact: true });
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.evaluate(() => sessionStorage.setItem('repeat-preview-logout-response', 'error'));
  await trigger.click();
  const confirm = page.getByRole('button', { name: 'Подтвердить выход со всех устройств' });
  await confirm.click();
  await expect(page.getByRole('alert')).toContainText('Не удалось подтвердить');
  await expect(page).toHaveURL(/\/app\/settings/);
  if (['chromium', 'narrow-chromium'].includes(info.project.name))
    await page
      .getByRole('dialog')
      .screenshot({ path: `../docs/qa/stage9-security-${info.project.name}.png` });
  const request = page.waitForRequest((r) => r.url().endsWith('/logout') && r.method() === 'POST');
  await confirm.click();
  expect((await request).postDataJSON()).toEqual({ allSessions: true });
  await expect(page).toHaveURL(/\/auth\/login/);
  await page.goto('/app/settings');
  await expect(page).toHaveURL(/\/auth\/login/);
});
test('lost logout response never reports global success', async ({ page }) => {
  await openSettings(page);
  await page.evaluate(() => sessionStorage.setItem('repeat-preview-logout-response', 'lost'));
  await page.getByRole('button', { name: 'Завершить все сессии', exact: true }).click();
  const confirm = page.getByRole('button', { name: 'Подтвердить выход со всех устройств' });
  await confirm.click();
  await expect(page.getByRole('alert')).toContainText('статус остальных сессий не подтверждён');
  await confirm.click();
  await expect(page).toHaveURL(/\/auth\/login/);
});
test('downloads applied settings, handles browser failure and adapts to large text', async ({
  page,
}, info) => {
  await openSettings(page);
  const appliedName = await page.getByLabel('Как вас называть', { exact: true }).inputValue();
  await page.getByLabel('Как вас называть', { exact: true }).fill('Несохранённое имя');
  await page.getByRole('radio', { name: 'Вектор', exact: true }).check();
  await page.getByRole('button', { name: 'Сохранить настройки наставника', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Скачать настройки JSON' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('repeat-settings.json');
  const stream = await file.createReadStream();
  const chunks = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  expect(data.profile.displayName).toBe(appliedName);
  expect(data.mentor.persona).toBe('vector');
  expect(Object.keys(data).sort()).toEqual([
    'device',
    'exportedAt',
    'format',
    'mentor',
    'profile',
    'scope',
    'version',
  ]);
  await page.evaluate(() => {
    URL.createObjectURL = () => {
      throw new Error('Blocked');
    };
  });
  await page.getByRole('button', { name: 'Скачать настройки JSON' }).click();
  await expect(page.getByRole('alert')).toContainText('Не удалось подготовить файл');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  const overflow = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
    elements: [...document.querySelectorAll('body *')]
      .filter(
        (element) =>
          element.getBoundingClientRect().right > innerWidth + 1 ||
          element.scrollWidth > element.clientWidth + 1,
      )
      .slice(0, 30)
      .map((element) => ({
        tag: element.tagName,
        class: element.className,
        text: element.textContent?.slice(0, 70),
        width: element.getBoundingClientRect().width,
        scroll: element.scrollWidth,
      })),
  }));
  expect(overflow.scroll, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '';
  });
  if (['chromium', 'narrow-chromium'].includes(info.project.name))
    await page
      .locator('#privacy')
      .screenshot({ path: `../docs/qa/stage9-privacy-${info.project.name}.png` });
  await page.getByRole('link', { name: 'Перейти к восстановлению пароля' }).click();
  await expect(page).toHaveURL(/\/auth\/restore/);
});
