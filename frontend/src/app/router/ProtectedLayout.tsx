import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useSession, useSessionActions } from '@/features/auth';
import { StatusPanel } from '@/components/molecules/StatusPanel';
export default function ProtectedLayout() {
  const session = useSession();
  const { forget } = useSessionActions();
  const location = useLocation();
  const navigate = useNavigate();
  const redirecting = useRef(false);
  useEffect(() => {
    if (session.data === null && !redirecting.current) {
      redirecting.current = true;
      void forget().then(() =>
        navigate(
          `/auth/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`,
          { replace: true },
        ),
      );
    }
  }, [session.data, forget, navigate, location.pathname, location.search]);
  if (session.isError)
    return (
      <main id="main" tabIndex={-1} className="boot-message">
        <StatusPanel
          state="error"
          title="Не удалось проверить сессию"
          description="Проверьте подключение и попробуйте ещё раз."
          onRetry={() => void session.refetch()}
        />
      </main>
    );
  if (!session.data)
    return (
      <main id="main" tabIndex={-1} className="boot-message">
        <StatusPanel
          state="loading"
          title="Проверяем сессию"
          description="Это займёт немного времени."
        />
      </main>
    );
  return <Outlet context={session.data} />;
}
