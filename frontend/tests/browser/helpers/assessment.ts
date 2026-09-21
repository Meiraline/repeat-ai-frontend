import { expect, type Page } from '@playwright/test';
export async function prepareTopic(page: Page, id: string, topic: string) {
  await page.evaluate(
    async ({ id, topic }) => {
      const base = `/api/v1/__preview/tracks/${id}/topics/${topic}`;
      const lesson = (await (await fetch(base)).json()).data;
      for (const m of lesson.materials.filter((m: { required: boolean }) => m.required)) {
        const r = await fetch(`${base}/materials/${m.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
          body: JSON.stringify({ completed: true, expectedVersion: m.version }),
        });
        if (!r.ok) throw new Error(`Preparation: ${r.status}`);
      }
    },
    { id, topic },
  );
}
export async function passTopicApi(page: Page, id: string, topic: string) {
  await prepareTopic(page, id, topic);
  await page.evaluate(
    async ({ id, topic }) => {
      const url = `/api/v1/__preview/tracks/${id}/assessments/exam/${topic}`;
      const post = async (body: unknown) => {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error(`Assessment: ${r.status}`);
        return (await r.json()).data;
      };
      let a = await post({ action: 'start' });
      a = await post({
        action: 'save',
        attemptId: a.id,
        expectedVersion: a.version,
        answers: {
          q1: 'b',
          q2: ['a', 'b'],
          q3: 'пример',
          q4: 'Это подробный тестовый ответ для проверки интерфейса.',
        },
        project: { description: '', url: '' },
      });
      await post({
        action: 'submit',
        attemptId: a.id,
        expectedVersion: a.version,
        allowUnanswered: false,
      });
      const key = 'repeat-preview-assessments:student@example.test',
        db = JSON.parse(sessionStorage.getItem(key)!);
      db[id].assessments[`exam:${topic}`].attempts.at(-1).submittedAt -= 10000;
      sessionStorage.setItem(key, JSON.stringify(db));
      const result = (await (await fetch(url)).json()).data;
      if (result.attempt.status !== 'passed') throw new Error('Exam did not pass');
    },
    { id, topic },
  );
}
export async function fillExam(page: Page) {
  await page.getByLabel('Получение итогового статуса проверки', { exact: true }).check();
  await page.getByRole('button', { name: 'Далее', exact: true }).click();
  await page.getByLabel('Проверить требования', { exact: true }).check();
  await page.getByLabel('Проверить сохранение ответов', { exact: true }).check();
  await page.getByRole('button', { name: 'Далее', exact: true }).click();
  await page.getByRole('textbox', { name: 'Ваш ответ' }).fill('пример');
  await page.getByRole('button', { name: 'Далее', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Ваш ответ' })
    .fill('Сравню результат с требованиями и проверю ограничения метода.');
  await expect(
    page.getByRole('status', { exact: false }).filter({ hasText: /^Сохранено$/ }),
  ).toBeVisible();
}
export async function submitWork(page: Page, project = false) {
  await page
    .getByRole('button', { name: project ? 'Отправить на проверку' : 'Сдать экзамен', exact: true })
    .click();
  await page
    .getByRole('dialog', { name: 'Отправить работу?' })
    .getByRole('button', { name: 'Подтвердить отправку' })
    .click();
}
