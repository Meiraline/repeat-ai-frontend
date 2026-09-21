import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getBilling } from '../api/billing.api';
import type { Billing } from './billing.schema';
import { ApiError } from '@/shared/api/errors';
const key = ['session', 'billing'] as const;
export function useBilling(forget: () => Promise<void>) {
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => getBilling(signal),
    retry: false,
  });
  const client = useQueryClient();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [confirmCancel, setConfirmCancel] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (query.error instanceof ApiError && query.error.status === 401) void forget();
  }, [query.error, forget]);
  async function act(operation: (signal: AbortSignal) => Promise<Billing>) {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError('');
    await client.cancelQueries({ queryKey: key });
    try {
      const data = await operation(controller.signal);
      if (controller.signal.aborted) return;
      client.setQueryData(key, data);
      setConfirmCancel(false);
      return data;
    } catch (cause) {
      if (controller.signal.aborted) return;
      if (cause instanceof ApiError && cause.status === 401) {
        await forget();
        return;
      }
      setError('Не удалось подтвердить изменение. Обновите статус перед повторной попыткой.');
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setBusy(false);
      }
    }
  }
  async function refresh() {
    if (request.current) return;
    const result = await query.refetch();
    if (result.isSuccess) {
      setError('');
      setConfirmCancel(false);
    }
  }
  return { query, busy, error, confirmCancel, setConfirmCancel, act, refresh };
}
