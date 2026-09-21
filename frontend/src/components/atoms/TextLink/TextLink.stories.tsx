import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextLink } from './TextLink';
const meta = {
  title: 'atoms/TextLink',
  component: TextLink,
  args: { href: '#destination', children: 'Войти в аккаунт' },
} satisfies Meta<typeof TextLink>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Medium: Story = {};
export const Small: Story = { args: { size: 'small' } };
export const Caption: Story = { args: { size: 'caption' } };
