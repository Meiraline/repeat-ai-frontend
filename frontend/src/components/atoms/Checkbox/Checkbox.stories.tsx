import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './Checkbox';
const meta = {
  title: 'atoms/Checkbox',
  component: Checkbox,
  args: { 'aria-label': 'Согласие' },
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Unchecked: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
