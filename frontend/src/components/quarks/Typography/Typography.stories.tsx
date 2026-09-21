import type { Meta, StoryObj } from '@storybook/react-vite';
import { Typography } from './Typography';
const meta = {
  title: 'quarks/Typography',
  component: Typography,
  args: { children: 'Знания. Развитие. Твои результаты.' },
} satisfies Meta<typeof Typography>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Body: Story = {};
export const Heading: Story = { args: { as: 'h1', variant: 'heading' } };
export const Caption: Story = { args: { variant: 'caption', tone: 'muted' } };
