import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AccessibilitySettings } from './AccessibilitySettings';
const meta = {
  title: 'Organisms/AccessibilitySettings',
  component: AccessibilitySettings,
  args: {
    textSize: '100',
    reduceMotion: false,
    systemReducedMotion: false,
    onTextSize: () => {},
    onReduceMotion: () => {},
  },
  render: function Interactive(args) {
    const [textSize, setTextSize] = useState(args.textSize);
    const [reduceMotion, setReduceMotion] = useState(args.reduceMotion);
    return (
      <AccessibilitySettings
        {...args}
        textSize={textSize}
        reduceMotion={reduceMotion}
        onTextSize={setTextSize}
        onReduceMotion={setReduceMotion}
      />
    );
  },
} satisfies Meta<typeof AccessibilitySettings>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const SystemReducedMotion: Story = { args: { systemReducedMotion: true } };
