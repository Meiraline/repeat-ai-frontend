import { expect, type Page } from '@playwright/test';
export async function start(page: Page) {
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
      const r = await fetch(`/api/v1/__preview${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`Seed: ${r.status}`);
      return (await r.json()).data;
    };
    let d = await request('/plans', undefined, { 'Idempotency-Key': crypto.randomUUID() });
    d = await request(
      `/plans/${d.id}`,
      {
        ...d,
        phase: 'summary',
        step: 7,
        acceptedRisk: true,
        brief: {
          skill: 'Аналитика данных',
          targetOutcome: 'Создать рабочий дашборд',
          currentLevel: 'Начальный',
          targetDate: '2099-12-01',
          hoursPerWeek: '4',
          preferredFormats: 'Статьи',
          constraints: 'Открытые материалы',
        },
      },
      { 'If-Match': String(d.version) },
      'PUT',
    );
    await request(
      `/plans/${d.id}/jobs`,
      { version: d.version },
      { 'Idempotency-Key': d.generationKey },
    );
    const k = 'repeat-preview-plans:student@example.test',
      db = JSON.parse(sessionStorage.getItem(k)!);
    db.jobs[0].startedAt -= 10000;
    sessionStorage.setItem(k, JSON.stringify(db));
    const review = await request(`/plan-reviews/${d.id}`, undefined, {}, 'GET');
    const approved = await request(
      `/plan-reviews/${d.id}`,
      {
        action: 'approve',
        expectedPlanVersion: review.version,
        timezone: 'UTC',
        acknowledgements: { parameters: true, gaps: true },
      },
      { 'Idempotency-Key': crypto.randomUUID() },
    );
    return approved.track.id as string;
  });
  await page.goto(`/app/tracks/${id}`);
  await expect(page.getByRole('heading', { name: 'Учебная программа', exact: true })).toBeVisible();
  return id;
}
