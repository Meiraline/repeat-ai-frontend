import type { Meta, StoryObj } from '@storybook/react-vite';
import { LandingFeature } from './LandingFeature';
import image from '../../../assets/landing/trust.png';

const meta = {
  title: 'Organisms/LandingFeature',
  component: LandingFeature,
  args: {
    id: 'trust',
    title: 'Учись с ИИ, ',
    accent: 'проверяй источники',
    description: 'Материалы, практика и помощь наставника на каждом шаге обучения.',
    image,
    width: 1448,
    height: 1086,
  },
} satisfies Meta<typeof LandingFeature>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Reversed: Story = { args: { reverse: true } };
