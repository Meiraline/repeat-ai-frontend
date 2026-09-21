import type { Meta, StoryObj } from '@storybook/react-vite';
import { TutorMessage } from './TutorMessage';
const meta = {
  title: 'Molecules/TutorMessage',
  component: TutorMessage,
  args: {
    role: 'assistant',
    partial: false,
    version: 1,
    sources: [],
    children: <p>Демонстрационный ответ репетитора.</p>,
  },
} satisfies Meta<typeof TutorMessage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Partial: Story = { args: { partial: true } };
