import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from './Spinner';
const meta = {
  title: 'atoms/Spinner',
  component: Spinner,
  args: { label: 'Загрузка' },
} satisfies Meta<typeof Spinner>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Small: Story = { args: { size: 24 } };
