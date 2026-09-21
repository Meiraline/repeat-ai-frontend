export type FieldError = { field: string; code: string; message: string };

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly retryable = false,
    public readonly requestId?: string,
    public readonly fieldErrors: FieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeApiError(body: unknown, status: number, headerRequestId?: string) {
  const envelope = isRecord(body) && isRecord(body.detail) ? body.detail : body;
  const error = isRecord(envelope) && isRecord(envelope.error) ? envelope.error : {};
  const meta = isRecord(envelope) && isRecord(envelope.meta) ? envelope.meta : {};
  const fields = Array.isArray(error.fieldErrors)
    ? error.fieldErrors.filter(
        (field): field is FieldError =>
          isRecord(field) &&
          typeof field.field === 'string' &&
          typeof field.code === 'string' &&
          typeof field.message === 'string',
      )
    : [];

  return new ApiError(
    typeof error.message === 'string' ? error.message : 'Не удалось выполнить запрос.',
    status,
    typeof error.code === 'string' ? error.code : `HTTP_${status}`,
    error.retryable === true,
    typeof meta.requestId === 'string' ? meta.requestId : headerRequestId,
    fields,
  );
}
