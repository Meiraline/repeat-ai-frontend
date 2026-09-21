import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeadlineCalendar } from './DeadlineCalendar';
const meta = {
  title: 'Organisms/DeadlineCalendar',
  component: DeadlineCalendar,
  args: { deadlines: [] },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DeadlineCalendar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const WithDeadlines: Story = {
  args: { deadlines: [{ id: '1', title: 'Аналитика данных', date: '2026-09-24T10:00:00Z' }] },
};
