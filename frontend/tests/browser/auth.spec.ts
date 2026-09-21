import { expect, test, type Page } from '@playwright/test';
async function login(page: Page, email = 'student@example.test', password = 'Repeat123') {
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Пароль', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
}
test('protected direct URL, refresh, mobile menu, logout and expired session', async ({ page }) => {
  await page.goto('/app/courses');
  await expect(page).toHaveURL(/auth\/login\?returnTo/);
  await login(page);
  await expect(page).toHaveURL(/\/app\/courses$/);
  await expect(page.getByText('Начните с первого курса')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Начните с первого курса')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  const menu = page.getByRole('button', { name: 'Меню', exact: true });
  await menu.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await menu.click();
  await page.getByRole('dialog').getByRole('button', { name: 'Выйти', exact: true }).click();
  await expect(page).toHaveURL(/auth\/login/);
  await page.goto('/app');
  await expect(page).toHaveURL(/auth\/login/);
  await login(page);
  await expect(page.getByText('Начните с первого курса')).toBeVisible();
  await page.evaluate(() => sessionStorage.removeItem('repeat-preview-session'));
  await page.reload();
  await expect(page).toHaveURL(/auth\/login/);
  await expect(page.getByText('Начните с первого курса')).toHaveCount(0);
});
test('registration, one-time verification, onboarding persistence and completion', async ({
  page,
}) => {
  await page.goto('/auth/register');
  await page.getByRole('button', { name: 'Создать аккаунт', exact: true }).click();
  await expect(page.getByText('Укажите имя.', { exact: true })).toBeVisible();
  await page.getByLabel('Имя', { exact: true }).fill('Мария');
  await page.getByLabel('Email', { exact: true }).fill('maria@example.test');
  await page.getByLabel('Пароль', { exact: true }).fill('Secret123');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Создать аккаунт', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Проверьте почту' })).toBeVisible();
  await page.goto('/auth/verify?token=preview-verify');
  await page.getByRole('button', { name: 'Подтвердить email' }).click();
  await expect(page.getByRole('heading', { name: 'Email подтверждён', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Войти', exact: true }).click();
  await login(page, 'maria@example.test', 'Secret123');
  await expect(page.getByRole('heading', { name: 'Настроим ваш профиль' })).toBeVisible();
  await page.getByLabel('Как вас называть').fill('Мария Тест');
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Как устроено обучение' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Как устроено обучение' })).toBeVisible();
  await page.getByRole('button', { name: 'Назад', exact: true }).click();
  await expect(page.getByLabel('Как вас называть')).toHaveValue('Мария Тест');
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await page.getByRole('button', { name: 'Начать знакомство' }).click();
  for (let step = 2; step <= 7; step++) {
    await expect(page.getByText(`${step - 1} из 7`, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  }
  await expect(page.getByLabel('Имя на дипломе')).toBeVisible();
  await page.getByRole('button', { name: 'Завершить знакомство' }).click();
  await expect(page.getByRole('heading', { name: 'Настройки сохранены' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Настройки сохранены' })).toBeVisible();
  await page.goto('/auth/verify?token=preview-verify');
  await page.getByRole('button', { name: 'Подтвердить email' }).click();
  await expect(page.getByRole('heading', { name: 'Ссылка недействительна' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Вернуться к подтверждению email' })).toBeVisible();
});
test('credentials errors, restore dialog focus, reset validation and token removal', async ({
  page,
}) => {
  await page.goto('/auth/login?returnTo=https://evil.test');
  await login(page, 'student@example.test', 'Wrong123');
  await expect(page.getByRole('alert')).toContainText('Неверный email');
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue('student@example.test');
  await page.getByRole('link', { name: 'Забыли пароль?' }).click();
  await expect(page.getByRole('heading', { name: 'Восстановить доступ', level: 1 })).toBeVisible();
  await page.getByLabel('Email', { exact: true }).fill('student@example.test');
  await page.getByRole('button', { name: 'Получить ссылку' }).click();
  await expect(page.getByRole('dialog')).toContainText('Если аккаунт существует');
  await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
  await expect(page.getByLabel('Email', { exact: true })).toBeFocused();
  await expect(page.getByRole('button', { name: /Отправить ещё раз через/ })).toBeDisabled();
  await page.goto('/auth/reset?token=preview-reset');
  await expect(page.getByLabel('Новый пароль', { exact: true })).toBeVisible();
  await expect(page).not.toHaveURL(/token=/);
  await page.getByLabel('Новый пароль', { exact: true }).fill('NewPass123');
  await page.getByLabel('Повторите пароль').fill('Other123');
  await page.getByRole('button', { name: 'Сохранить пароль' }).click();
  await expect(page.getByRole('alert')).toContainText('Пароли не совпадают');
  await page.getByLabel('Повторите пароль').fill('NewPass123');
  await page.getByRole('button', { name: 'Сохранить пароль' }).click();
  await expect(
    page.getByRole('heading', { name: 'Пароль обновлён', exact: true, level: 1 }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Войти', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Войти', level: 1 })).toBeVisible();
  await login(page, 'student@example.test', 'Repeat123');
  await expect(page.getByRole('alert')).toContainText('Неверный email');
  await login(page, 'student@example.test', 'NewPass123');
  await expect(page).toHaveURL(/\/app$/);
  await page.goto('/auth/reset');
  await expect(page.getByRole('heading', { name: 'Ссылка недействительна' })).toBeVisible();
});
test('auth layouts retain entered values across sizes and text enlargement', async ({ page }) => {
  await page.goto('/auth/register');
  await page.getByLabel('Имя', { exact: true }).fill('Очень длинное имя пользователя');
  for (const width of [320, 390, 768, 1023, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 740 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.getByLabel('Имя', { exact: true })).toHaveValue(
      'Очень длинное имя пользователя',
    );
  }
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addStyleTag({ content: 'html {font-size:200%}' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('button', { name: 'Создать аккаунт', exact: true })).toBeVisible();
});
