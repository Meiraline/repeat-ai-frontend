import { useState, type ReactNode } from 'react';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/errors';
import { DevicePreferencesProvider } from '@/features/settings';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      queryCache: new QueryCache({
        onError: (error) => {
          if (error instanceof ApiError && error.status === 401)
            client.setQueryData(['session', 'profile'], null);
        },
      }),
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          retry: (count, error) =>
            count < 1 &&
            error instanceof ApiError &&
            error.retryable &&
            (error.status === 0 || error.status >= 500),
        },
        mutations: { retry: false },
      },
    });
    return client;
  });
  return (
    <QueryClientProvider client={queryClient}>
      <DevicePreferencesProvider>{children}</DevicePreferencesProvider>
    </QueryClientProvider>
  );
}
