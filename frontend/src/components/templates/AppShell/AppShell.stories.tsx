import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell } from './AppShell';
const meta = {
  title: 'Templates/AppShell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
  args: {
    name: 'Александра',
    navigation: (
      <>
        <a href="#courses" aria-current="page">
          Мои курсы
        </a>
        <a href="#onboarding">Знакомство с сервисом</a>
      </>
    ),
    children: <p>Здесь будет ваше обучение.</p>,
    onLogout: () => {},
    loggingOut: false,
  },
} satisfies Meta<typeof AppShell>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const LogoutError: StoryObj<typeof meta> = {
  args: { logoutError: 'Не удалось завершить сессию. Попробуйте ещё раз.' },
};
