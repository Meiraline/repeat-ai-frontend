import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { MentorSettingsFields } from './MentorSettingsFields';
const meta = {
  title: 'Organisms/MentorSettingsFields',
  component: MentorSettingsFields,
  args: {
    value: {
      persona: 'vector',
      help: 'hint',
      detail: 'balanced',
      suggestNext: false,
      checkUnderstanding: false,
      suggestPractice: false,
    },
    onChange: () => {},
  },
  render: function Interactive(args) {
    const [value, setValue] = useState(args.value);
    return <MentorSettingsFields value={value} onChange={setValue} />;
  },
} satisfies Meta<typeof MentorSettingsFields>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
