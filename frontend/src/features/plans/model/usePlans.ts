import { useQuery } from '@tanstack/react-query';
import { env } from '@/shared/config/env';
import { getDraft, getJob, listDrafts } from '../api/plans.api';
import { isJobPending } from './plan.schema';
export const draftKey = (id: string) => ['session', 'plans', id] as const;
export function useDrafts() {
  return useQuery({
    queryKey: ['session', 'plans'],
    queryFn: ({ signal }) => listDrafts(signal),
    enabled: env.enableMocks,
    retry: false,
  });
}
export function useDraft(id: string) {
  return useQuery({
    queryKey: draftKey(id),
    queryFn: ({ signal }) => getDraft(id, signal),
    enabled: !!id,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
export function usePlanJob(id: string | null) {
  return useQuery({
    queryKey: ['session', 'plan-job', id],
    queryFn: ({ signal }) => getJob(id!, signal),
    enabled: !!id,
    retry: false,
    refetchInterval: (q) => (!q.state.error && isJobPending(q.state.data?.status) ? 1000 : false),
    refetchOnWindowFocus: false,
  });
}
