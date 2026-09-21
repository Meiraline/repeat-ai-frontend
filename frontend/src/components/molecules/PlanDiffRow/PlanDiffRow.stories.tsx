import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlanDiffRow } from './PlanDiffRow';
const meta = {
  title: 'Molecules/PlanDiffRow',
  component: PlanDiffRow,
  args: { title: 'Нагрузка', before: '4 часа в неделю', after: '3 часа в неделю' },
} satisfies Meta<typeof PlanDiffRow>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const LongText: Story = {
  args: {
    title: 'Ограничения',
    before: 'Только открытые материалы',
    after: 'Сохранить все темы. ' + 'Больше практики и самостоятельных заданий. '.repeat(12),
  },
};
