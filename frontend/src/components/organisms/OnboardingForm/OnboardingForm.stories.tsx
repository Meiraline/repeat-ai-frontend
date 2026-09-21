import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { OnboardingForm, type PreferenceValues } from './OnboardingForm';
const meta = {
  title: 'Organisms/OnboardingForm',
  component: OnboardingForm,
  args: {
    step: 3,
    title: 'Ваш учебный ритм по умолчанию',
    fields: [
      {
        key: 'minutes',
        label: 'Время на занятие',
        options: [
          { value: '15', label: '15 минут' },
          { value: '30', label: '30 минут' },
        ],
      },
    ],
    values: { minutes: '30' },
    pending: false,
    onChange: () => {},
    onNext: () => {},
    onBack: () => {},
    onSkip: () => {},
  },
} satisfies Meta<typeof OnboardingForm>;
export default meta;
export const Interactive: StoryObj<typeof meta> = {
  render: function Example(args) {
    const [values, setValues] = useState<PreferenceValues>(args.values);
    return (
      <OnboardingForm
        {...args}
        values={values}
        onChange={(key, value) => setValues({ ...values, [key]: value })}
      />
    );
  },
};
