import { useEffect, useState, type ReactNode } from 'react';
import { Dialog } from '@/components/molecules/Dialog';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/quarks/Icon';
import logo from '@/assets/screens/logo.png';
import styles from './AppShell.module.css';
type Props = {
  name: string;
  navigation: ReactNode;
  children: ReactNode;
  onLogout: () => void;
  loggingOut: boolean;
  logoutError?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
};
export function AppShell({
  name,
  navigation,
  children,
  onLogout,
  loggingOut,
  logoutError,
  title = 'Мои курсы',
  description = 'Учитесь в удобном темпе.',
  action,
}: Props) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 64rem)');
    const close = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener('change', close);
    return () => media.removeEventListener('change', close);
  }, []);
  const nav = (
    <>
      <a href="/" className={styles.logo} aria-label="Репит.центр — главная">
        <img src={logo} alt="Репит.центр" width="260" height="87" />
      </a>
      <nav
        aria-label="Разделы кабинета"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('a')) setOpen(false);
        }}
      >
        {navigation}
      </nav>
      <div className={styles.logout}>
        {logoutError && <p role="alert">{logoutError}</p>}
        <Button
          variant="neutral"
          fullWidth
          loading={loggingOut}
          onClick={onLogout}
          leadingIcon={<Icon name="logout" size={20} />}
        >
          Выйти
        </Button>
      </div>
      <small>repeat.center · обучение</small>
    </>
  );
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>{nav}</aside>
      <div className={styles.workspace}>
        <header className={styles.header}>
          <Button
            className={styles.menuButton}
            variant="outline"
            size="small"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={(event) => {
              event.currentTarget.focus();
              setOpen(true);
            }}
          >
            Меню
          </Button>
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          {action}
          <span className={styles.account}>
            <span aria-hidden="true">{name.slice(0, 1)}</span>
            {name}
          </span>
        </header>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
      </div>
      <Dialog open={open} title="Меню" onClose={() => setOpen(false)}>
        <div className={styles.mobileNav}>
          {nav}
          <Button variant="outline" onClick={() => setOpen(false)}>
            Закрыть меню
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
