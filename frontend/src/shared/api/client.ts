import { env } from '@/shared/config/env';
import { ApiError, isRecord, normalizeApiError } from './errors';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  json?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

type ClientOptions = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export function createApiClient({
  baseUrl,
  fetchImpl = (input, init) => fetch(input, init),
  timeoutMs = 15_000,
}: ClientOptions) {
  return async function request(path: string, options: RequestOptions = {}): Promise<unknown> {
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
      throw new Error('API request paths must be relative to the configured API base.');
    }
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');
    if (options.json !== undefined) headers.set('Content-Type', 'application/json');
    const body = options.json === undefined ? undefined : JSON.stringify(options.json);
    const controller = new AbortController();
    const abort = () => controller.abort(options.signal?.reason);
    options.signal?.addEventListener('abort', abort, { once: true });
    if (options.signal?.aborted) abort();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    try {
      // No implicit retries: a mutation may have succeeded before the connection was lost.
      const response = await fetchImpl(`${baseUrl}${path}`, {
        method: options.method ?? 'GET',
        credentials: 'include',
        headers,
        body,
        signal: controller.signal,
      });
      if (response.status === 204) return undefined;

      const text = await response.text();
      let payload: unknown;
      try {
        payload = JSON.parse(text);
      } catch {
        if (!response.ok) {
          throw normalizeApiError(
            undefined,
            response.status,
            response.headers.get('X-Request-Id') ?? undefined,
          );
        }
        throw new ApiError('Сервер вернул неожиданный ответ.', response.status, 'INVALID_RESPONSE');
      }
      if (!response.ok) {
        throw normalizeApiError(
          payload,
          response.status,
          response.headers.get('X-Request-Id') ?? undefined,
        );
      }
      if (!isRecord(payload) || !Object.hasOwn(payload, 'data')) {
        throw new ApiError('Сервер вернул неожиданный ответ.', response.status, 'INVALID_RESPONSE');
      }
      return payload.data;
    } catch (error) {
      if (options.signal?.aborted) {
        throw options.signal.reason ?? new DOMException('Request cancelled', 'AbortError');
      }
      if (timedOut) throw new ApiError('Сервер не ответил вовремя.', 0, 'TIMEOUT', true);
      if (error instanceof ApiError) throw error;
      throw new ApiError('Проверьте подключение к интернету.', 0, 'NETWORK_ERROR', true);
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', abort);
    }
  };
}

export const api = createApiClient({ baseUrl: env.apiBaseUrl });
