import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { clearAuthMemory, getProfile, logout } from '../api/auth.api';

export const sessionKey = ['session', 'profile'] as const;
export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: ({ signal }) => getProfile(signal),
    staleTime: 0,
    retry: false,
  });
}
export function useSessionActions() {
  const client = useQueryClient();
  const forget = useCallback(async () => {
    await client.cancelQueries();
    clearAuthMemory();
    // Keep the observed profile query alive so the protected layout receives null.
    // Clearing it first detaches the observer and can leave private UI on screen after 401.
    client.setQueryData(sessionKey, null);
    client.removeQueries({
      predicate: (query) =>
        query.queryKey.length !== 2 ||
        query.queryKey[0] !== sessionKey[0] ||
        query.queryKey[1] !== sessionKey[1],
    });
  }, [client]);
  const signOut = useCallback(async () => {
    await logout();
    await forget();
  }, [forget]);
  const refresh = useCallback(async () => {
    await client.cancelQueries();
    client.clear();
    return client.fetchQuery({
      queryKey: sessionKey,
      queryFn: ({ signal }) => getProfile(signal),
      staleTime: 0,
    });
  }, [client]);
  return { forget, signOut, refresh };
}
