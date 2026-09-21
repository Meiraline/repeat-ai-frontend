import { useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router';
import { AppShell } from '@/components/templates/AppShell';
import { Icon, type IconName } from '@/components/quarks/Icon';
import { useSessionActions, type Profile } from '@/features/auth';

export function Workspace({
  children,
  title,
  description,
  action,
  active = 'courses',
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  active?: 'courses' | 'new' | 'knowledge' | 'tutor' | 'diplomas' | 'settings' | 'billing';
}) {
  const profile = useOutletContext<Profile>(),
    navigate = useNavigate(),
    { signOut } = useSessionActions();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const lock = useRef(false);
  async function logout() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await signOut();
      void navigate('/auth/login', { replace: true });
    } catch {
      setError('Не удалось завершить сессию. Попробуйте ещё раз.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <AppShell
      name={profile.displayName}
      title={title}
      description={description}
      action={action}
      onLogout={() => void logout()}
      loggingOut={busy}
      logoutError={error}
      navigation={
        <>
          <Link to="/app" aria-current={active === 'courses' ? 'page' : undefined}>
            <Icon name="route" size={20} />
            Мои курсы
          </Link>
          <Link to="/app/knowledge" aria-current={active === 'knowledge' ? 'page' : undefined}>
            <Icon name="book" size={20} />
            База знаний
          </Link>
          <Link to="/app/tutor" aria-current={active === 'tutor' ? 'page' : undefined}>
            <Icon name="tutor" size={20} />
            AI-репетитор
          </Link>
          {(
            [
              ['Прогресс', 'analytics'],
              ['Архив курсов', 'archive'],
            ] as [string, IconName][]
          ).map(([label, icon]) => (
            <button key={label} disabled title="Раздел появится на следующем этапе">
              <Icon name={icon} size={20} />
              {label}
            </button>
          ))}
          <Link to="/app/plans/new" aria-current={active === 'new' ? 'page' : undefined}>
            <Icon name="route" size={20} />
            Новый курс
          </Link>
          <Link to="/app/diplomas" aria-current={active === 'diplomas' ? 'page' : undefined}>
            <Icon name="book" size={20} />
            Дипломы
          </Link>
          <Link to="/onboarding">
            <Icon name="settings" size={20} />
            Знакомство с сервисом
          </Link>
          <Link to="/app/settings" aria-current={active === 'settings' ? 'page' : undefined}>
            <Icon name="settings" size={20} />
            Настройки
          </Link>
          <Link to="/legal/privacy">
            <Icon name="privacy" size={20} />
            Конфиденциальность
          </Link>
          <Link to="/app/billing" aria-current={active === 'billing' ? 'page' : undefined}>
            <Icon name="settings" size={20} />
            Тариф и оплата
          </Link>
        </>
      }
    >
      {children}
    </AppShell>
  );
}
