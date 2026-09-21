import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AppearanceSettings } from './AppearanceSettings';
const meta = {
  title: 'Organisms/AppearanceSettings',
  component: AppearanceSettings,
  args: { accent: 'blue', onChange: () => {} },
  render: function Interactive(args) {
    const [accent, setAccent] = useState(args.accent);
    return <AppearanceSettings accent={accent} onChange={setAccent} />;
  },
} satisfies Meta<typeof AppearanceSettings>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Blue: Story = {};
export const Purple: Story = { args: { accent: 'purple' } };
export const Green: Story = { args: { accent: 'green' } };
