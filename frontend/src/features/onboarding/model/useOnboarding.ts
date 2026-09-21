import { useQuery } from '@tanstack/react-query';
import { getOnboarding } from '../api/onboarding.api';
export function useOnboarding() {
  return useQuery({
    queryKey: ['onboarding'],
    queryFn: ({ signal }) => getOnboarding(signal),
    retry: false,
  });
}
