import type { Meta, StoryObj } from '@storybook/react-vite';
import { CourseCard } from './CourseCard';
const meta = {
  title: 'Molecules/CourseCard',
  component: CourseCard,
  args: {
    title: 'Планирование проектов',
    progress: 81,
    topic: 'Итоговая практика',
    risk: 'overdue',
    onOpen: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CourseCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const InProgress: Story = {};
export const LongTitle: Story = {
  args: { title: 'Анализ больших данных и проектирование интерактивных панелей', risk: null },
};
