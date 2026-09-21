import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './atoms/Button';
import { Input } from './atoms/Input';
import { Checkbox } from './atoms/Checkbox';
import { TextLink } from './atoms/TextLink';
import { Spinner } from './atoms/Spinner';
import { Icon } from './quarks/Icon';
import { Typography } from './quarks/Typography';
import { TextField } from './molecules/TextField';
import { PromptLink } from './molecules/PromptLink';
import { ConsentRow } from './molecules/ConsentRow';
import styles from '../../.storybook/DesignSystem.module.css';

const meta = {
  title: 'Design system/Auth foundations',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// Component composition for visual QA only; no authentication or fake success.
function AuthPreview() {
  const [error, setError] = useState(false);
  return (
    <div className={styles.canvas}>
      <form
        className={styles.card}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setError(true);
        }}
      >
        <Typography as="h1" variant="heading">
          Войти
        </Typography>
        <Typography tone="muted">Введите email и пароль, чтобы продолжить обучение.</Typography>
        <TextField
          label="Email"
          type="email"
          name="email"
          size="large"
          autoComplete="email"
          placeholder="Введите значение"
          leadingIcon={<Icon name="mail" size={32} />}
          error={error ? 'Укажите корректный адрес электронной почты.' : undefined}
        />
        <TextField
          label="Пароль"
          type="password"
          name="password"
          size="large"
          autoComplete="current-password"
          placeholder="Введите значение"
          leadingIcon={<Icon name="lock" size={32} />}
        />
        <TextLink href="#restore" size="small" standalone>
          Забыли пароль?
        </TextLink>
        <Button type="submit" size="auth" fullWidth>
          Войти
        </Button>
        <PromptLink prompt="Нет аккаунта?" href="#register">
          Создать аккаунт
        </PromptLink>
      </form>
    </div>
  );
}
export const AuthComposition: Story = { render: () => <AuthPreview /> };

export const States: Story = {
  render: () => (
    <div className={styles.canvas}>
      <div className={styles.gallery}>
        <section className={styles.section} aria-label="Кнопки">
          <Typography as="h2" variant="heading">
            Кнопки
          </Typography>
          <div className={styles.wrap}>
            <Button>Создать аккаунт</Button>
            <Button variant="outline">Продолжить</Button>
            <Button variant="secondary">Позже</Button>
            <Button variant="neutral">Отмена</Button>
            <Button variant="danger">Удалить</Button>
            <Button disabled>Недоступно</Button>
            <Button loading>Сохраняем</Button>
            <Button size="small">Маленькая</Button>
            <Button fullWidth>
              Очень длинная подпись действия, которая переносится и остаётся доступной на небольшом
              экране
            </Button>
          </div>
        </section>
        <section className={styles.section} aria-label="Поля">
          <Typography as="h2" variant="heading">
            Поля и ошибки
          </Typography>
          <Input label="Обычное поле" placeholder="Введите значение" />
          <TextField
            label="Поле с ошибкой"
            defaultValue="example"
            hint="Подсказка помогает заполнить поле"
            error="Проверьте введённое значение и исправьте его перед продолжением."
          />
          <TextField label="Отключённое поле" disabled defaultValue="Недоступно" />
          <TextField
            label="Очень длинная подпись поля для проверки переноса текста при увеличении масштаба"
            placeholder="Длинное значение"
          />
          <TextField label="Пароль для проверки" type="password" defaultValue="example-password" />
        </section>
        <section className={styles.section} aria-label="Согласие">
          <Typography as="h2" variant="heading">
            Согласие и ссылки
          </Typography>
          <ConsentRow name="consent" termsHref="#terms" privacyHref="#privacy" />
          <ConsentRow
            name="consent-error"
            termsHref="#terms"
            privacyHref="#privacy"
            error="Для продолжения необходимо ваше согласие."
          />
          <label className={styles.wrap}>
            <Checkbox disabled defaultChecked />
            Недоступный чекбокс
          </label>
          <PromptLink prompt="Уже зарегистрированы?" href="#login">
            Войти в аккаунт
          </PromptLink>
        </section>
        <section className={styles.section} aria-label="Загрузка">
          <Typography as="h2" variant="heading">
            Загрузка
          </Typography>
          <Spinner />
        </section>
      </div>
    </div>
  ),
};
