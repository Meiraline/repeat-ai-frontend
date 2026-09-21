import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConsentRow } from './ConsentRow';
const meta = {
  title: 'molecules/ConsentRow',
  component: ConsentRow,
  args: { termsHref: '#terms', privacyHref: '#privacy' },
} satisfies Meta<typeof ConsentRow>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Error: Story = { args: { error: 'Подтвердите согласие' } };
export const Disabled: Story = { args: { disabled: true } };
