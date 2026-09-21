import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusPanel } from './StatusPanel';

const meta = {
  title: 'Foundation/StatusPanel',
  component: StatusPanel,
  args: {
    title: 'Здесь будет ваше обучение',
    description: 'Учебные программы появятся в этом разделе.',
  },
} satisfies Meta<typeof StatusPanel>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Loading: Story = {
  args: {
    state: 'loading',
    title: 'Загружаем обучение',
    description: 'Это займёт немного времени.',
  },
};
export const Error: Story = {
  args: {
    state: 'error',
    title: 'Не удалось загрузить обучение',
    description: 'Проверьте подключение и попробуйте ещё раз.',
  },
};
