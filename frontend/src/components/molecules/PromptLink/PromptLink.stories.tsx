import type { Meta, StoryObj } from '@storybook/react-vite';
import { PromptLink } from './PromptLink';
const meta = {
  title: 'molecules/PromptLink',
  component: PromptLink,
  args: { prompt: 'Нет аккаунта?', href: '#register', children: 'Создать аккаунт' },
} satisfies Meta<typeof PromptLink>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
