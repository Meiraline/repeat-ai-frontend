import type { Meta, StoryObj } from '@storybook/react-vite';
import { AuthTemplate } from './AuthTemplate';
import illustration from '@/assets/screens/login.png';
import { AuthForm } from '@/components/organisms/auth/AuthForm';
const meta = {
  title: 'Templates/AuthTemplate',
  component: AuthTemplate,
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'С возвращением',
    description: 'Продолжите обучение с того места, где остановились.',
    illustration,
    reassurance: 'Возвращайтесь к маршруту с любого устройства',
    children: (
      <AuthForm
        title="Войти"
        description="Введите email и пароль, чтобы продолжить обучение."
        fields={[
          { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
          { name: 'password', label: 'Пароль', type: 'password', autoComplete: 'current-password' },
        ]}
        errors={{}}
        pending={false}
        submitLabel="Войти"
        onSubmit={async () => {}}
      />
    ),
  },
} satisfies Meta<typeof AuthTemplate>;
export default meta;
export const Login: StoryObj<typeof meta> = {};
