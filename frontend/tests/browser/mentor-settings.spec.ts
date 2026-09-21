import { expect, test } from '@playwright/test';
import { start } from './helpers/start-learning';
test.setTimeout(90000);
const behaviorControls = [
  'Быстрые ответы',
  'Использовать аналогии',
  'В заданиях — сначала направлять',
  'Задавать уточняющие вопросы',
];
test('settings persist, affect new answers and preserve partial answer snapshots', async ({
  page,
}, info) => {
  const id = await start(page);
  await page.goto('/app/settings#mentor');
  for (const name of behaviorControls)
    await page.getByRole('checkbox', { name, exact: true }).check();
  await page.getByRole('radio', { name: 'Вектор', exact: true }).check();
  await page.getByLabel('Предпочитаемый формат помощи', { exact: true }).selectOption('solution');
  await page.getByLabel('Подробность ответа', { exact: true }).selectOption('detailed');
  await page.getByLabel('Базовый стиль и тон', { exact: true }).selectOption('friendly');
  for (const name of ['Тёплый', 'Восторженный', 'Заголовки и списки', 'Эмодзи'])
    await page.getByLabel(name, { exact: true }).selectOption('more');
  for (const name of ['Предлагаемые подсказки', 'Проверять понимание', 'Предлагать практику'])
    await page.getByRole('checkbox', { name, exact: true }).check();
  await page.getByRole('button', { name: 'Сохранить настройки наставника', exact: true }).click();
  await page.reload();
  for (const name of behaviorControls)
    await expect(page.getByRole('checkbox', { name, exact: true })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'Вектор', exact: true })).toBeChecked();
  await expect(page.getByLabel('Базовый стиль и тон', { exact: true })).toHaveValue('friendly');
  await expect(page.getByLabel('Тёплый', { exact: true })).toHaveValue('more');
  await expect(
    page.getByRole('checkbox', { name: 'Проверять понимание', exact: true }),
  ).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '';
  });
  if (['chromium', 'narrow-chromium'].includes(info.project.name)) {
    await page.locator('#mentor img').evaluateAll(async (images) => {
      await Promise.all(
        images.map(async (image) => {
          const img = image as HTMLImageElement;
          img.loading = 'eager';
          await img.decode();
        }),
      );
    });
    await page
      .locator('#mentor')
      .screenshot({ path: `../docs/qa/stage9-mentor-${info.project.name}.png` });
  }
  await page.goto(`/app/tracks/${id}/tutor`);
  await expect(page.getByRole('heading', { name: 'Вектор', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Новый диалог', exact: true }).click();
  await page.evaluate(() => sessionStorage.setItem('repeat-preview-tutor-response', 'partial'));
  await page.getByRole('textbox', { name: 'Ваше сообщение', exact: true }).fill('Помоги с темой');
  await page.getByRole('button', { name: 'Отправить', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Восстановить ответ' })).toBeVisible();
  const chat = page.url();
  await page.goto('/app/settings#mentor');
  for (const name of behaviorControls)
    await page.getByRole('checkbox', { name, exact: true }).uncheck();
  await page.getByRole('radio', { name: 'Астра', exact: true }).check();
  await page.getByLabel('Предпочитаемый формат помощи', { exact: true }).selectOption('hint');
  await page.getByLabel('Подробность ответа', { exact: true }).selectOption('short');
  await page.getByLabel('Базовый стиль и тон', { exact: true }).selectOption('concise');
  for (const name of ['Тёплый', 'Восторженный', 'Заголовки и списки', 'Эмодзи'])
    await page.getByLabel(name, { exact: true }).selectOption('less');
  for (const name of ['Предлагаемые подсказки', 'Проверять понимание', 'Предлагать практику'])
    await page.getByRole('checkbox', { name, exact: true }).uncheck();
  await page.getByRole('button', { name: 'Сохранить настройки наставника', exact: true }).click();
  await page.goto(chat);
  await page.getByRole('button', { name: 'Восстановить ответ' }).click();
  const answers = page.getByRole('article', { name: 'Ответ репетитора' });
  await expect(answers.first()).toContainText('Вектор');
  await expect(answers.first()).toContainText('Демонстрация настроек · Подробно. Подсказка:');
  await expect(answers.first()).toContainText('Аналогия (демонстрация)');
  await expect(answers.first()).toContainText('Уточнение (демонстрация)');
  await expect(answers.first()).toContainText('Давай разберём тему вместе');
  await expect(answers.first()).toContainText('💡');
  await expect(
    answers.first().getByRole('heading', { name: 'План разбора (демонстрация)' }),
  ).toBeVisible();
  for (const label of [
    'Следующий вопрос (демонстрация)',
    'Проверка понимания (демонстрация)',
    'Практика (демонстрация)',
  ])
    await expect(answers.first()).toContainText(label);
  await page.getByRole('textbox', { name: 'Ваше сообщение', exact: true }).fill('Следующий вопрос');
  await page.getByRole('button', { name: 'Отправить', exact: true }).click();
  await expect(answers).toHaveCount(2);
  await expect(answers.last()).toContainText('Астра');
  await expect(answers.last()).not.toContainText('Аналогия (демонстрация)');
  await expect(answers.last()).not.toContainText('Уточнение (демонстрация)');
  await expect(answers.last()).toContainText('Демонстрация настроек · Кратко. Подсказка:');
  await expect(answers.last()).toContainText('Суть: понятие, применение, проверка.');
  await expect(answers.last()).not.toContainText('💡');
  await expect(answers.last().getByRole('heading')).toHaveCount(0);
  for (const label of [
    'Следующий вопрос (демонстрация)',
    'Проверка понимания (демонстрация)',
    'Практика (демонстрация)',
  ])
    await expect(answers.last()).not.toContainText(label);
});
test('cancel, reset and storage failure do not falsely report success', async ({ page }) => {
  await page.goto('/app/settings');
  await page.getByLabel('Email', { exact: true }).fill('student@example.test');
  await page.getByLabel('Пароль', { exact: true }).fill('Repeat123');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await page.getByRole('radio', { name: 'Вектор', exact: true }).check();
  await page.getByRole('button', { name: 'Отменить настройки наставника', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Лира', exact: true })).toBeChecked();
  await page.getByRole('radio', { name: 'Вектор', exact: true }).check();
  await page.getByRole('button', { name: 'Сохранить настройки наставника', exact: true }).click();
  await page.getByRole('button', { name: 'Сбросить наставника', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Лира', exact: true })).toBeChecked();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'repeat-device-mentor-v1') throw new DOMException('Blocked', 'SecurityError');
      return original.call(this, key, value);
    };
  });
  await page.getByRole('radio', { name: 'Астра', exact: true }).check();
  await page.getByRole('button', { name: 'Сохранить настройки наставника', exact: true }).click();
  await expect(
    page.getByText('Браузер не разрешил сохранить настройки наставника.', { exact: false }),
  ).toBeVisible();
});
