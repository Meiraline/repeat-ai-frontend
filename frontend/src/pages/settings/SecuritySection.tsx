import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/atoms/Button';
import { Dialog } from '@/components/molecules/Dialog';
import { useSessionActions } from '@/features/auth';
import { env } from '@/shared/config/env';
import { ApiError } from '@/shared/api/errors';
import styles from './SettingsPage.module.css';

export function SecuritySection() {
  const { signOut, forget } = useSessionActions();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  async function finish() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await signOut(true);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        await forget();
        return;
      }
      setError(
        'Не удалось подтвердить завершение всех сессий. Можно повторить запрос. Если текущая сессия уже завершена, потребуется войти снова; статус остальных сессий не подтверждён.',
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section id="security" className={styles.panel} aria-labelledby="security-title">
      <h2 id="security-title">Безопасность и сессии</h2>
      <h3>Пароль</h3>
      <p>
        Для смены пароля используйте восстановление доступа по email. Прямая смена пароля и
        двухфакторная защита пока не подключены.
      </p>
      <Link to="/auth/restore">Перейти к восстановлению пароля</Link>
      <h3>Доступ к аккаунту</h3>
      <p>
        Завершение всех сессий включает текущую. Потребуется повторный вход. Список устройств и
        завершение отдельной сессии пока недоступны.
      </p>
      {env.enableMocks && (
        <p className={styles.notice}>
          В демонстрации завершается только сессия этой вкладки. Другие устройства и реальные
          аккаунты не затрагиваются.
        </p>
      )}
      <Button
        variant="outline"
        onClick={(event) => {
          event.currentTarget.focus();
          setError('');
          setConfirm(true);
        }}
      >
        Завершить все сессии
      </Button>
      <Dialog
        open={confirm}
        title="Завершить все сессии?"
        onClose={() => {
          if (!lock.current) setConfirm(false);
        }}
      >
        <p>
          Вы выйдете из аккаунта в этом браузере. Сначала сохраните изменения в формах. Настройки
          устройства останутся сохранёнными.
        </p>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <Button variant="neutral" disabled={busy} onClick={() => setConfirm(false)}>
            Остаться в аккаунте
          </Button>
          <Button loading={busy} onClick={() => void finish()}>
            Подтвердить выход со всех устройств
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
