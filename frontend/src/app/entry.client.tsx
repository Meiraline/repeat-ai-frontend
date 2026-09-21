import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';
import { env } from '@/shared/config/env';

async function bootstrap() {
  if (import.meta.env.DEV && env.enableMocks) {
    const { startMocks } = await import('@/mocks/browser');
    await startMocks();
  } else if ('serviceWorker' in navigator) {
    // A developer may have switched this origin from mock mode to a real API.
    // Only remove our dev worker, never another application's worker.
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      const worker = registration.active ?? registration.waiting ?? registration.installing;
      if (worker && new URL(worker.scriptURL).pathname === '/mockServiceWorker.js') {
        await registration.unregister();
      }
    }
  }

  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <HydratedRouter />
      </StrictMode>,
    );
  });
}

void bootstrap().catch(() => {
  // Keep already-rendered HTML readable if hydration or worker startup fails.
  const message = document.createElement('p');
  message.setAttribute('role', 'alert');
  message.textContent = 'Не удалось открыть приложение. Обновите страницу и попробуйте ещё раз.';
  document.body.prepend(message);
});
