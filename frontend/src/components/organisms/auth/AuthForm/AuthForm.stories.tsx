import type { Meta, StoryObj } from '@storybook/react-vite';
import { AuthForm } from './AuthForm';
const meta = {
  title: 'Organisms/AuthForm',
  component: AuthForm,
  args: {
    title: 'Войти',
    description: 'Введите email и пароль.',
    fields: [
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'password', label: 'Пароль', type: 'password' },
    ],
    errors: {},
    pending: false,
    submitLabel: 'Войти',
    onSubmit: async () => {},
  },
} satisfies Meta<typeof AuthForm>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const ServerError: StoryObj<typeof meta> = {
  args: { errors: { form: 'Неверный email или пароль.' } },
};
export const Loading: StoryObj<typeof meta> = { args: { pending: true } };
