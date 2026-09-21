import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';
const meta = {
  title: 'atoms/Input',
  component: Input,
  args: { label: 'Email', placeholder: 'Введите значение' },
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Medium: Story = {};
export const Large: Story = { args: { size: 'large' } };
export const Error: Story = { args: { invalid: true } };
export const Disabled: Story = { args: { disabled: true } };
