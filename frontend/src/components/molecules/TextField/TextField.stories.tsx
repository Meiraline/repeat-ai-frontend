import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextField } from './TextField';
const meta = {
  title: 'molecules/TextField',
  component: TextField,
  args: { label: 'Email', hint: 'Укажите email, с которым вы зарегистрировались' },
} satisfies Meta<typeof TextField>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Error: Story = { args: { error: 'Не удалось найти этот адрес.' } };
export const Password: Story = {
  args: { label: 'Пароль', type: 'password', hint: 'Не менее 8 символов' },
};
