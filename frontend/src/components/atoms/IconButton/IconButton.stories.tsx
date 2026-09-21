import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from './IconButton';
const meta = {
  title: 'atoms/IconButton',
  component: IconButton,
  args: { icon: 'eye', label: 'Показать пароль' },
} satisfies Meta<typeof IconButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Outlined: Story = {};
export const Plain: Story = { args: { appearance: 'plain' } };
export const Disabled: Story = { args: { disabled: true } };
