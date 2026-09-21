import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { start } from './helpers/start-learning';
import { prepareTopic, passTopicApi, fillExam, submitWork } from './helpers/assessment';
test.setTimeout(90000);
test('full preview cycle: exam, unlock, project, confirmed name and sample PNG download', async ({
  page,
}) => {
  const id = await start(page);
  await prepareTopic(page, id, '1');
  await page.goto(`/app/tracks/${id}/exam/1`);
  await page.getByRole('button', { name: 'Начать экзамен' }).click();
  await fillExam(page);
  await page.reload();
  await expect(
    page.getByLabel('Получение итогового статуса проверки', { exact: true }),
  ).toBeChecked();
  await submitWork(page);
  await expect(
    page.getByRole('heading', { name: /Работа отправлена|Идёт проверка/ }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Критерий выполнен' })).toBeVisible({
    timeout: 12000,
  });
  await passTopicApi(page, id, '2');
  await passTopicApi(page, id, '3');
  await page.getByRole('link', { name: 'К итоговому проекту' }).click();
  await page.getByRole('button', { name: 'Начать проект' }).click();
  await page
    .getByRole('textbox', { name: 'Описание результата' })
    .fill('Создан демонстрационный дашборд. Проверены показатели, исходные данные и ограничения.');
  await page
    .getByRole('textbox', { name: 'Ссылка на результат (необязательно)' })
    .fill('javascript:alert(1)');
  await expect(page.getByRole('alert')).toContainText('HTTP/HTTPS');
  await page
    .getByRole('textbox', { name: 'Ссылка на результат (необязательно)' })
    .fill('https://example.com/project');
  await expect(page.getByRole('status').filter({ hasText: /^Сохранено$/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Описание результата' })).toContainText(
    'Создан демонстрационный',
  );
  await submitWork(page, true);
  await expect(page.getByRole('heading', { name: 'Критерий выполнен' })).toBeVisible({
    timeout: 12000,
  });
  await page.getByRole('link', { name: 'Перейти к диплому' }).click();
  await page.getByRole('textbox', { name: 'Имя для диплома' }).fill('Анна-Мария Иванова');
  await page.evaluate(() => sessionStorage.setItem('repeat-preview-diploma-response', 'lost'));
  await page.getByRole('button', { name: 'Подтвердить и создать' }).click();
  await expect(page.getByRole('alert')).toContainText('Ответ потерян');
  await page.getByRole('button', { name: 'Подтвердить и создать' }).click();
  await expect(page.getByRole('heading', { name: 'Подготавливаем образец' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Образец документа' })).toBeVisible({
    timeout: 12000,
  });
  await expect(page.getByText('Анна-Мария Иванова', { exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Скачать образец PNG' }).click();
  const file = await download;
  expect((await readFile((await file.path())!)).subarray(0, 8).toString('hex')).toBe(
    '89504e470d0a1a0a',
  );
});
test('lost start save and submit responses do not duplicate attempts or unlock twice', async ({
  page,
}) => {
  const id = await start(page);
  await prepareTopic(page, id, '1');
  await page.goto(`/app/tracks/${id}/exam/1`);
  await page.evaluate(() => sessionStorage.setItem('repeat-preview-assessment-response', 'start'));
  await page.getByRole('button', { name: 'Начать экзамен' }).click();
  await expect(page.getByRole('alert')).toContainText('Ответ потерян');
  await page.getByRole('button', { name: 'Начать экзамен' }).click();
  await page.evaluate(() => sessionStorage.setItem('repeat-preview-assessment-response', 'save'));
  await page.getByLabel('Получение итогового статуса проверки', { exact: true }).check();
  await expect(page.getByRole('alert')).toContainText('Ответ потерян');
  await page.getByRole('button', { name: 'Сохранить сейчас' }).click();
  await expect(page.getByRole('status').filter({ hasText: /^Сохранено$/ })).toBeVisible();
  await fillExam(page);
  await page.evaluate(() => sessionStorage.setItem('repeat-preview-assessment-response', 'submit'));
  await submitWork(page);
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Ответ потерян');
  await page.getByRole('dialog').getByRole('button', { name: 'Подтвердить отправку' }).click();
  await expect(page.getByRole('heading', { name: 'Критерий выполнен' })).toBeVisible({
    timeout: 12000,
  });
  expect(
    await page.evaluate(
      (id) =>
        JSON.parse(sessionStorage.getItem('repeat-preview-assessments:student@example.test')!)[id]
          .assessments['exam:1'].attempts.length,
      id,
    ),
  ).toBe(1);
  expect(
    await page.evaluate(async (id) => {
      const data = (await (await fetch(`/api/v1/__preview/tracks/${id}/assessments/exam/1`)).json())
        .data;
      const r = await fetch(`/api/v1/__preview/tracks/${id}/assessments/exam/1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({
          action: 'save',
          attemptId: data.attempt.id,
          expectedVersion: data.attempt.version,
          answers: {},
          project: { description: '', url: '' },
        }),
      });
      return r.status;
    }, id),
  ).toBe(409);
});
test('server rejects early entry, omitted answers require confirmation and ambiguous result never unlocks', async ({
  page,
}) => {
  const id = await start(page);
  expect(
    await page.evaluate(
      async (id) =>
        (
          await fetch(`/api/v1/__preview/tracks/${id}/assessments/exam/2`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
            body: JSON.stringify({ action: 'start' }),
          })
        ).status,
      id,
    ),
  ).toBe(403);
  await page.goto(`/app/tracks/${id}/diploma`);
  await expect(page.getByRole('heading', { name: 'Курс ещё не завершён' })).toBeVisible();
  await prepareTopic(page, id, '1');
  await page.goto(`/app/tracks/${id}/exam/1`);
  await page.getByRole('button', { name: 'Начать экзамен' }).click();
  await page.getByRole('button', { name: 'Сдать экзамен' }).click();
  await expect(page.getByRole('dialog')).toContainText('без ответа осталось вопросов — 4');
  await page.getByRole('button', { name: 'Подтвердить отправку' }).click();
  await expect(page.getByRole('heading', { name: 'Нужна доработка' })).toBeVisible({
    timeout: 12000,
  });
  await page.getByRole('button', { name: 'Новая попытка' }).click();
  await fillExam(page);
  await page.evaluate(() =>
    sessionStorage.setItem('repeat-preview-assessment-outcome', 'review_required'),
  );
  await submitWork(page);
  await expect(page.getByRole('heading', { name: 'Нужна дополнительная проверка' })).toBeVisible({
    timeout: 12000,
  });
  expect(
    await page.evaluate(
      async (id) => (await fetch(`/api/v1/__preview/tracks/${id}/topics/2`)).status,
      id,
    ),
  ).toBe(403);
  await expect(page.getByRole('button', { name: 'Новая попытка' })).toHaveCount(0);
});
test('conflict preserves answer; expired server deadline closes editing and submission', async ({
  page,
}) => {
  const id = await start(page);
  await prepareTopic(page, id, '1');
  await page.goto(`/app/tracks/${id}/exam/1`);
  await page.getByRole('button', { name: 'Начать экзамен' }).click();
  await page.getByRole('button', { name: 'Вопрос 4, без ответа' }).click();
  await page.evaluate((id) => {
    const key = 'repeat-preview-assessments:student@example.test',
      db = JSON.parse(sessionStorage.getItem(key)!);
    db[id].assessments['exam:1'].attempts[0].version++;
    sessionStorage.setItem(key, JSON.stringify(db));
  }, id);
  await page
    .getByRole('textbox', { name: 'Ваш ответ' })
    .fill('Мой развёрнутый ответ нельзя терять при конфликте.');
  await expect(page.getByRole('alert')).toContainText('Версия изменилась');
  await expect(page.getByRole('textbox', { name: 'Ваш ответ' })).toHaveValue(
    'Мой развёрнутый ответ нельзя терять при конфликте.',
  );
  await page
    .getByRole('button', { name: 'Загрузить сохранённую попытку и заменить черновик' })
    .click();
  await page.evaluate((id) => {
    const key = 'repeat-preview-assessments:student@example.test',
      db = JSON.parse(sessionStorage.getItem(key)!);
    db[id].assessments['exam:1'].attempts[0].dueAt = new Date(Date.now() + 2500).toISOString();
    sessionStorage.setItem(key, JSON.stringify(db));
  }, id);
  await page.reload();
  await expect(page.getByText(/Осталось:/)).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Время истекло', { timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Сдать экзамен' })).toBeDisabled();
  await page
    .getByRole('button', { name: 'Загрузить сохранённую попытку и заменить черновик' })
    .click();
  await expect(page.getByRole('heading', { name: 'Время истекло' })).toBeVisible();
});
test('unsaved narrow freeform stays editable after offline save and navigation cancellation', async ({
  page,
}) => {
  const id = await start(page);
  await prepareTopic(page, id, '1');
  await page.goto(`/app/tracks/${id}/exam/1`);
  await page.getByRole('button', { name: 'Начать экзамен' }).click();
  await page.getByRole('button', { name: 'Вопрос 4, без ответа' }).click();
  await page.setViewportSize({ width: 320, height: 600 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
    sessionStorage.setItem('repeat-preview-assessment-response', 'offline-save');
  });
  await page.getByRole('textbox', { name: 'Ваш ответ' }).fill('ОченьДлинныйТекст'.repeat(80));
  await expect(page.getByRole('alert')).toContainText('соединение прервано');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.getByRole('link', { name: 'К карте курса' }).click();
  await expect(page.getByRole('dialog', { name: 'Покинуть попытку?' })).toBeVisible();
  await page.getByRole('button', { name: 'Остаться', exact: true }).click();
  await page.getByRole('button', { name: 'Сохранить сейчас' }).click();
  await expect(page.getByRole('status').filter({ hasText: /^Сохранено$/ })).toBeVisible();
  await page.evaluate(() => sessionStorage.removeItem('repeat-preview-session'));
  await page.getByRole('textbox', { name: 'Ваш ответ' }).fill('Проверка истекшей сессии');
  await expect(page.getByRole('heading', { name: 'Войти', exact: true })).toBeVisible();
});
