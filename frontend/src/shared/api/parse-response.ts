import type { z } from 'zod';
import { ApiError } from './errors';
export function parseResponse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new ApiError(
      'Сервер вернул неожиданный ответ. Попробуйте позже.',
      502,
      'INVALID_RESPONSE',
    );
  return result.data;
}
