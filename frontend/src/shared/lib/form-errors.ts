import { ZodError } from 'zod';
import { ApiError } from '@/shared/api/errors';
export function formErrors(error: unknown): Record<string, string> {
  if (error instanceof ZodError)
    return Object.fromEntries(
      error.issues.map((issue) => [String(issue.path[0] ?? 'form'), issue.message]),
    );
  if (error instanceof ApiError)
    return {
      form: error.message,
      ...Object.fromEntries(error.fieldErrors.map((field) => [field.field, field.message])),
    };
  return { form: 'Не удалось выполнить действие. Попробуйте ещё раз.' };
}
