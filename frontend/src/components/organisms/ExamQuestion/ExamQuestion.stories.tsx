import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExamQuestion } from './ExamQuestion';
const meta = {
  title: 'Organisms/ExamQuestion',
  component: ExamQuestion,
  args: {
    question: {
      id: 'demo',
      type: 'single',
      title: 'Выберите вариант ответа',
      options: [
        { id: 'a', text: 'Первый вариант' },
        { id: 'b', text: 'Второй вариант' },
      ],
    },
    value: 'b',
    disabled: false,
    onChange: () => {},
  },
} satisfies Meta<typeof ExamQuestion>;
export default meta;
export const Single: StoryObj<typeof meta> = {};
export const Free: StoryObj<typeof meta> = {
  args: {
    question: { id: 'free', type: 'free', title: 'Объясните своё решение', options: [] },
    value: '',
  },
};
