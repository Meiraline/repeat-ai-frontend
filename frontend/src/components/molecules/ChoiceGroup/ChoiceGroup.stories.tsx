import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChoiceGroup } from './ChoiceGroup';
const meta = {
  title: 'Molecules/ChoiceGroup',
  component: ChoiceGroup,
  args: {
    label: 'Учебный ритм',
    options: [
      { value: '15', label: '15 минут' },
      { value: '30', label: '30 минут' },
      { value: '45', label: '45 минут' },
    ],
    value: '30',
    onChange: () => {},
  },
} satisfies Meta<typeof ChoiceGroup>;
export default meta;
export const Interactive: StoryObj<typeof meta> = {
  render: function Example(args) {
    const [value, setValue] = useState<string | string[]>('30');
    return <ChoiceGroup {...args} value={value} onChange={setValue} />;
  },
};
export const Disabled: StoryObj<typeof meta> = { args: { disabled: true } };
