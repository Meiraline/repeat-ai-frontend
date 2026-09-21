import type { Meta, StoryObj } from '@storybook/react-vite';
import { LearningContent } from './LearningContent';
const meta = {
  title: 'Organisms/LearningContent',
  component: LearningContent,
  args: {
    blocks: [
      { type: 'heading', text: 'Учебный материал' },
      { type: 'paragraph', text: 'Текст конспекта и ключевые понятия.' },
      { type: 'list', items: ['Изучить понятие', 'Выполнить практику'] },
      { type: 'code', language: 'Text', text: 'goal -> practice -> self-check' },
      { type: 'table', headers: ['Тема', 'Статус'], rows: [['Введение', 'Доступно']] },
    ],
  },
} satisfies Meta<typeof LearningContent>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
