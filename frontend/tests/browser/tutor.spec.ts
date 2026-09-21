import { expect, test, type Page } from '@playwright/test';
import { start } from './helpers/start-learning';
test.setTimeout(60000);
async function chat(page: Page) {
  const id = await start(page);
  await page.getByRole('link', { name: 'Спросить репетитора' }).click();
  await page.getByLabel('Тема нового диалога', { exact: true }).selectOption('1');
  await page.getByRole('button', { name: 'Новый диалог', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Ваше сообщение', exact: true })).toBeVisible();
  return id;
}
async function send(page: Page, message = 'Объясни тему\nс примером') {
  await page.getByRole('textbox', { name: 'Ваше сообщение', exact: true }).fill(message);
  await page.getByRole('button', { name: 'Отправить', exact: true }).click();
}
test('history persists, Enter is a newline, messages are escaped and threads are isolated', async ({
  page,
}) => {
  await chat(page);
  await page
    .getByRole('textbox', { name: 'Ваше сообщение', exact: true })
    .fill('<img src=x onerror=alert(1)>');
  await page.getByRole('textbox', { name: 'Ваше сообщение', exact: true }).press('Enter');
  await expect(page.getByRole('article', { name: 'Ваше сообщение' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Отправить', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Ответ репетитора' })).toHaveCount(1);
  const first = page.url();
  await page.reload();
  await expect(page.getByRole('article', { name: 'Ваше сообщение' })).toContainText(
    '<img src=x onerror=alert(1)>',
  );
  await expect(page.getByRole('article', { name: 'Ваше сообщение' }).locator('img')).toHaveCount(0);
  await page.getByRole('button', { name: 'Новый диалог', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Ваше сообщение' })).toHaveCount(0);
  await page.goto(first);
  await expect(page.getByRole('article', { name: 'Ответ репетитора' })).toContainText(
    'Источники не использовались',
  );
});
test('lost response retry creates one pair; partial answer restores after reload', async ({
  page,
}) => {
  await chat(page);
  await page.evaluate(() => sessionStorage.setItem('repeat-preview-tutor-response', 'lost'));
  await send(page);
  await expect(page.getByRole('alert')).toContainText('Ответ потерян');
  await page.getByRole('button', { name: 'Повторить отправку' }).click();
  await expect(page.getByRole('article', { name: 'Ваше сообщение' })).toHaveCount(1);
  await expect(page.getByRole('textbox', { name: 'Ваше сообщение', exact: true })).toHaveValue('');
  await page.evaluate(() => sessionStorage.setItem('repeat-preview-tutor-response', 'partial'));
  await send(page, 'Продолжим');
  await expect(page.getByRole('button', { name: 'Восстановить ответ' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Восстановить ответ' }).click();
  await expect(page.getByRole('button', { name: 'Восстановить ответ' })).toHaveCount(0);
  await expect(page.getByRole('article', { name: 'Ваше сообщение' })).toHaveCount(2);
  await expect(page.getByRole('article', { name: 'Ответ репетитора' })).toHaveCount(2);
});
test('stale context requires confirmation, preserves draft and rejects locked topic requests', async ({
  page,
}) => {
  const id = await chat(page);
  await page.evaluate((id) => {
    const key = 'repeat-preview-learning:student@example.test',
      db = JSON.parse(sessionStorage.getItem(key)!);
    db[id].track.planVersion++;
    sessionStorage.setItem(key, JSON.stringify(db));
  }, id);
  await send(page, 'Мой вопрос');
  await expect(page.getByRole('button', { name: 'Обновить контекст', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Обновить контекст', exact: true }).click();
  await page.getByRole('button', { name: 'Подтвердить новый контекст' }).click();
  await expect(page.getByRole('textbox', { name: 'Ваше сообщение', exact: true })).toHaveValue(
    'Мой вопрос',
  );
  await page.getByRole('button', { name: 'Отправить', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Ответ репетитора' })).toContainText(
    'Контекст v2',
  );
  expect(
    await page.evaluate(
      async (id) =>
        (
          await fetch(`/api/v1/__preview/tracks/${id}/tutor/threads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
            body: JSON.stringify({ topicId: '2', contextVersion: 2 }),
          })
        ).status,
      id,
    ),
  ).toBe(403);
});
test('offline retry preserves text; navigation requires an explicit discard', async ({ page }) => {
  await chat(page);
  await page.evaluate(() => sessionStorage.setItem('repeat-preview-tutor-response', 'offline'));
  await send(page, 'Несохранённый вопрос');
  await expect(page.getByRole('alert')).toContainText('Соединение прервано');
  await page.getByRole('link', { name: 'Вернуться к обучению' }).click();
  await expect(page.getByRole('dialog', { name: 'Покинуть диалог?' })).toBeVisible();
  await page.getByRole('button', { name: 'Остаться', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Ваше сообщение', exact: true })).toHaveValue(
    'Несохранённый вопрос',
  );
  await page.getByRole('button', { name: 'Повторить отправку' }).click();
  await expect(page.getByRole('article', { name: 'Ваше сообщение' })).toHaveCount(1);
});
test('other identities cannot read a course chat and expired session returns to login', async ({
  page,
}) => {
  const id = await chat(page);
  expect(
    await page.evaluate(async (id) => {
      const identity = sessionStorage.getItem('repeat-preview-identity')!;
      sessionStorage.setItem('repeat-preview-identity', 'another@example.test');
      const response = await fetch(`/api/v1/__preview/tracks/${id}/tutor`);
      sessionStorage.setItem('repeat-preview-identity', identity);
      return response.status;
    }, id),
  ).toBe(404);
  await page.evaluate(() => sessionStorage.removeItem('repeat-preview-session'));
  await send(page, 'Проверка сессии');
  await expect(page.getByRole('heading', { name: 'Войти', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'История сообщений' })).toHaveCount(0);
});
test('long history does not pull readers down; narrow resized viewport keeps composer reachable', async ({
  page,
}) => {
  const id = await chat(page);
  await send(page);
  await expect(page.getByRole('article', { name: 'Ответ репетитора' })).toHaveCount(1);
  await page.evaluate((id) => {
    const key = 'repeat-preview-tutor:student@example.test',
      db = JSON.parse(sessionStorage.getItem(key)!);
    const thread = db[id].threads[0],
      sample = thread.messages[1];
    for (let i = 0; i < 20; i++)
      thread.messages.push({
        ...sample,
        id: `long-${i}`,
        blocks: [
          { type: 'paragraph', text: 'Очень длинный пример ответа для чтения. '.repeat(30) },
        ],
      });
    sessionStorage.setItem(key, JSON.stringify(db));
  }, id);
  await page.reload();
  const history = page.getByRole('region', { name: 'История сообщений' });
  await expect(page.getByRole('article', { name: 'Ответ репетитора' })).toHaveCount(21);
  await history.evaluate((e) => {
    e.scrollTop = 0;
    e.dispatchEvent(new Event('scroll'));
  });
  await send(page, 'Следующий вопрос');
  await expect(page.getByRole('article', { name: 'Ответ репетитора' })).toHaveCount(22);
  expect(await history.evaluate((e) => e.scrollTop)).toBeLessThan(20);
  await page.getByRole('button', { name: 'К последнему сообщению' }).click();
  await page.setViewportSize({ width: 320, height: 460 });
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  const input = page.getByRole('textbox', { name: 'Ваше сообщение', exact: true });
  await input.fill('Клавиатура');
  await input.scrollIntoViewIfNeeded();
  await expect(input).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.getByRole('button', { name: 'Отправить', exact: true }).click();
  await expect(input).toHaveValue('');
});
