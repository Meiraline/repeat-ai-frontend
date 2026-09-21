import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../api/dashboard.api';

// The cache belongs to the current session. Clear it on any session change (AUTH stage).
export function useDashboard(filter: 'active' | 'attention' | 'completed' = 'active') {
  return useQuery({
    queryKey: ['session', 'dashboard', filter],
    queryFn: ({ signal }) => getDashboard(filter, signal),
    retry: false,
  });
}
