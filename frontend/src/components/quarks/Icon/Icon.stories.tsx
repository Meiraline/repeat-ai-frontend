import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from './Icon';
const meta = {
  title: 'quarks/Icon',
  component: Icon,
  args: { name: 'mail', size: 32 },
} satisfies Meta<typeof Icon>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Mail: Story = {};
export const Lock: Story = { args: { name: 'lock' } };
export const Eye: Story = { args: { name: 'eye' } };
export const Tintable: Story = { args: { name: 'chevronDown', label: 'Раскрыть' } };
