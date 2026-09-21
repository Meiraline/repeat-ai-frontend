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
      responseLanguage: 'course',
      strictness: 'balanced',
      exampleFrequency: 'normal',
      quickAnswers: false,
      useAnalogies: false,
      guideFirst: false,
      askClarifying: false,
      suggestNext: false,
      checkUnderstanding: false,
      suggestPractice: false,
      tone: 'professional',
      warmth: 'default',
      enthusiasm: 'default',
      structure: 'default',
      emoji: 'default',
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
