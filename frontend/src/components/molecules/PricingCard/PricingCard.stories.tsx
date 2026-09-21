import type { Meta, StoryObj } from '@storybook/react-vite';
import { PricingCard } from './PricingCard';
const meta = {
  title: 'Molecules/PricingCard',
  component: PricingCard,
  args: {
    name: 'Пилот',
    description: 'Полный учебный сценарий с ИИ',
    price: 990,
    period: '/ месяц',
    features: ['Полный доступ к курсам и тестам', 'Практика и разбор ошибок с ИИ'],
    credits: 600,
    trialDays: 7,
    current: false,
    available: true,
    highlighted: true,
    onSelect: () => {},
  },
} satisfies Meta<typeof PricingCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Pilot: Story = {};
export const Current: Story = { args: { current: true } };
export const Future: Story = {
  args: {
    name: 'Автор / эксперт',
    price: 2490,
    trialDays: 0,
    available: false,
    highlighted: false,
  },
};
