import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { InterviewForm } from './InterviewForm';
const meta = {
  title: 'Organisms/InterviewForm',
  component: InterviewForm,
  args: {
    question: 'Какой результат вы хотите получить после обучения?',
    hint: 'Сформулируйте измеримую цель.',
    value: '',
    onChange: () => {},
    onSubmit: () => {},
    onSave: () => {},
    busy: false,
  },
} satisfies Meta<typeof InterviewForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  render: function Render(args) {
    const [value, setValue] = useState('');
    return <InterviewForm {...args} value={value} onChange={setValue} />;
  },
};
export const Error: Story = {
  args: { value: 'Мой ответ сохранён в поле', error: 'Сервер недоступен. Попробуйте ещё раз.' },
};
export const Saving: Story = { args: { value: 'Собрать три проекта', busy: true } };
