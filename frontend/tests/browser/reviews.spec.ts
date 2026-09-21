import { expect, test, type Page } from '@playwright/test';
test.setTimeout(60000);
async function openReview(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel('Email', { exact: true }).fill('student@example.test');
  await page.getByLabel('Пароль', { exact: true }).fill('Repeat123');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Начните с первого курса' })).toBeVisible();
  const id = await page.evaluate(async () => {
    const request = async (
      path: string,
      body?: unknown,
      headers: Record<string, string> = {},
      method = 'POST',
    ) => {
      const response = await fetch(`/api/v1/__preview${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`Seed failed: ${response.status}`);
      return (await response.json()).data;
    };
    let draft = await request('/plans', undefined, { 'Idempotency-Key': crypto.randomUUID() });
    draft = await request(
      `/plans/${draft.id}`,
      {
        ...draft,
        phase: 'summary',
        step: 7,
        acceptedRisk: true,
        brief: {
          skill: 'Аналитика данных',
          targetOutcome: 'Собрать рабочий дашборд',
          currentLevel: 'Начальный',
          targetDate: '2099-12-01',
          hoursPerWeek: '4',
          preferredFormats: 'Видео и статьи',
          constraints: 'Открытые материалы',
        },
      },
      { 'If-Match': String(draft.version) },
      'PUT',
    );
    await request(
      `/plans/${draft.id}/jobs`,
      { version: draft.version },
      { 'Idempotency-Key': draft.generationKey },
    );
    const key = 'repeat-preview-plans:student@example.test',
      db = JSON.parse(sessionStorage.getItem(key)!);
    db.jobs[0].startedAt -= 10000;
    sessionStorage.setItem(key, JSON.stringify(db));
    return draft.id as string;
  });
  await page.goto(`/app/plans/${id}/review`);
  await expect(page.getByText('Черновик v1 · готов к проверке')).toBeVisible();
  return id;
}
async function propose(page: Page) {
  await page.getByRole('button', { name: 'Сократи нагрузку', exact: true }).click();
  await page.getByRole('button', { name: 'Предложить изменения', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Показать изменения' })).toBeVisible();
}
test('proposal survives reload; lost apply and approval responses do not duplicate versions or tracks', async ({
  page,
}) => {
  const id = await openReview(page);
  await propose(page);
  await page.reload();
  await expect(page.getByText('Черновик v1 · готов к проверке')).toBeVisible();
  await page.getByRole('button', { name: 'Показать изменения' }).click();
  const dialog = page.getByRole('dialog', { name: 'Изменения программы' });
  await expect(dialog.getByRole('heading', { name: 'Изменения программы' })).toBeFocused();
  await expect(dialog.getByText('Было', { exact: true })).toHaveCount(2);
  await expect(dialog.getByText('Станет', { exact: true })).toHaveCount(2);
  await page.evaluate(() => sessionStorage.setItem('repeat-preview-review-response', 'apply'));
  await dialog.getByRole('button', { name: 'Применить изменения' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Ответ потерян');
  await dialog.getByRole('button', { name: 'Применить изменения' }).click();
  await expect(page.getByText('Черновик v2 · готов к проверке')).toBeVisible();
  await page.getByRole('button', { name: 'Согласовать программу' }).click();
  const approve = page.getByRole('dialog', { name: 'Начать обучение' });
  await expect(approve.getByRole('heading', { name: 'Начать обучение' })).toBeFocused();
  await expect(
    approve.getByRole('button', { name: 'Начать обучение', exact: true }),
  ).toBeDisabled();
  await approve.getByLabel('Подтверждаю параметры программы и выбранную нагрузку').check();
  await expect(
    approve.getByRole('button', { name: 'Начать обучение', exact: true }),
  ).toBeDisabled();
  await approve.getByLabel('Принимаю пробелы в материалах текущей версии').check();
  await page.evaluate(() => sessionStorage.setItem('repeat-preview-review-response', 'approve'));
  await approve.getByRole('button', { name: 'Начать обучение', exact: true }).click();
  await expect(approve.getByRole('alert')).toContainText('Ответ потерян');
  await approve.getByRole('button', { name: 'Начать обучение', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Учебный трек создан' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Учебный трек создан' })).toBeVisible();
  await page.getByRole('link', { name: 'Открыть мои курсы' }).click();
  await expect(
    page
      .getByRole('region', { name: 'Учебные программы' })
      .getByRole('heading', { name: 'Аналитика данных' }),
  ).toHaveCount(1);
  const saved = await page.evaluate(
    (id) =>
      JSON.parse(sessionStorage.getItem('repeat-preview-reviews:student@example.test')!).reviews[
        id
      ],
    id,
  );
  expect(saved.version).toBe(2);
  expect(saved.program.hoursPerWeek).toBe(3);
  expect(saved.track.status).toBe('active');
});
test('version conflict preserves request; stale proposal cannot be applied and can be rejected', async ({
  page,
}) => {
  const id = await openReview(page);
  await page.getByLabel('Ваш запрос').fill('Добавьте самостоятельную работу');
  await page.evaluate((id) => {
    const k = 'repeat-preview-reviews:student@example.test',
      db = JSON.parse(sessionStorage.getItem(k)!);
    db.reviews[id].version++;
    sessionStorage.setItem(k, JSON.stringify(db));
  }, id);
  await page.getByRole('button', { name: 'Предложить изменения' }).click();
  await page.getByRole('button', { name: 'Загрузить актуальную версию' }).click();
  await expect(page.getByLabel('Ваш запрос')).toHaveValue('Добавьте самостоятельную работу');
  await page.getByRole('button', { name: 'Предложить изменения' }).click();
  await page.getByRole('button', { name: 'Показать изменения' }).click();
  await page.evaluate((id) => {
    const k = 'repeat-preview-reviews:student@example.test',
      db = JSON.parse(sessionStorage.getItem(k)!);
    db.reviews[id].version++;
    sessionStorage.setItem(k, JSON.stringify(db));
  }, id);
  await page.getByRole('button', { name: 'Применить изменения' }).click();
  await page.getByRole('button', { name: 'Загрузить актуальную версию' }).click();
  await page.getByRole('button', { name: 'Показать изменения' }).click();
  await page.getByRole('button', { name: 'Отклонить', exact: true }).click();
  await expect(page.getByLabel('Ваш запрос')).toBeVisible();
  await expect(page.getByText('Черновик v3 · готов к проверке')).toBeVisible();
});
test('narrow diff retains before and after, escapes markup, rejects and resubmits same request', async ({
  page,
}) => {
  await openReview(page);
  const text = '<script>alert(1)</script> ' + 'Длинное пожелание '.repeat(25);
  await page.getByLabel('Ваш запрос').fill(text);
  await page.getByRole('button', { name: 'Предложить изменения' }).click();
  await page.getByRole('button', { name: 'Показать изменения' }).click();
  await page.setViewportSize({ width: 320, height: 740 });
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  const dialog = page.getByRole('dialog', { name: 'Изменения программы' });
  await expect(dialog.getByText('Было', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Станет', { exact: true })).toBeVisible();
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await dialog.getByRole('button', { name: 'Отклонить', exact: true }).click();
  await page.getByLabel('Ваш запрос').fill(text);
  await page.getByRole('button', { name: 'Предложить изменения' }).click();
  await expect(page.getByRole('button', { name: 'Показать изменения' })).toBeVisible();
  await expect(page.getByText('Черновик v1 · готов к проверке')).toBeVisible();
});
test('server refuses unacknowledged gaps and guards unsent request navigation', async ({
  page,
}) => {
  const id = await openReview(page);
  const status = await page.evaluate(
    async (id) =>
      (
        await fetch(`/api/v1/__preview/plan-reviews/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
          body: JSON.stringify({
            action: 'approve',
            expectedPlanVersion: 1,
            timezone: 'UTC',
            acknowledgements: { parameters: true, gaps: false },
          }),
        })
      ).status,
    id,
  );
  expect(status).toBe(422);
  await page.getByLabel('Ваш запрос').fill('Несохранённое пожелание');
  await page.getByRole('link', { name: 'В кабинет', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Есть несохранённый запрос' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Ваш запрос')).toHaveValue('Несохранённое пожелание');
});
