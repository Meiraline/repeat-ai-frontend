import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
const meta = {
  title: 'atoms/Button',
  component: Button,
  args: { children: 'Создать аккаунт' },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Primary: Story = {};
export const Outline: Story = { args: { variant: 'outline' } };
export const Loading: Story = { args: { loading: true } };
export const Disabled: Story = { args: { disabled: true } };
