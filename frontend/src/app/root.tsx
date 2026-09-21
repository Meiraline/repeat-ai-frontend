import type { ReactNode } from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteError,
  Outlet,
} from 'react-router';
import { AppProviders } from './providers/AppProviders';
import './styles/global.css';
import { env } from '@/shared/config/env';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#f8faff" />
        <Meta />
        <Links />
      </head>
      <body>
        <a className="skip-link" href="#main" tabIndex={0}>
          К содержимому
        </a>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <AppProviders>
      {env.enableMocks && (
        <aside className="preview-banner" aria-label="Тестовый режим">
          Тестовый режим: данные и письма имитируются. Вход: student@example.test / Repeat123.
        </aside>
      )}
      <Outlet />
    </AppProviders>
  );
}

export function HydrateFallback() {
  return (
    <main id="main" tabIndex={-1} className="boot-message">
      <p role="status">Открываем repeat.ai…</p>
    </main>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const missing = isRouteErrorResponse(error) && error.status === 404;
  return (
    <main id="main" tabIndex={-1} className="boot-message">
      <h1>{missing ? 'Страница не найдена' : 'Не удалось открыть страницу'}</h1>
      <p>
        {missing ? 'Проверьте адрес или вернитесь на главную.' : 'Попробуйте обновить страницу.'}
      </p>
      <a href="/">На главную</a>
    </main>
  );
}
