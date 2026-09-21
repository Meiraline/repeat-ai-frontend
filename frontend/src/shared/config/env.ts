type EnvironmentInput = {
  VITE_API_BASE_URL?: string;
  VITE_ENABLE_MOCKS?: string;
  DEV: boolean;
  PROD: boolean;
};

export function parseEnvironment(input: EnvironmentInput) {
  const apiBaseUrl = (input.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');
  const absolute = /^https?:\/\//.test(apiBaseUrl);
  if (
    !apiBaseUrl ||
    (!absolute && !apiBaseUrl.startsWith('/')) ||
    apiBaseUrl.startsWith('//') ||
    /[\s\\?#]/.test(apiBaseUrl)
  ) {
    throw new Error(
      'VITE_API_BASE_URL must be an HTTP(S) URL or an absolute path without a query.',
    );
  }
  if (absolute) {
    const url = new URL(apiBaseUrl);
    if (url.username || url.password) throw new Error('API URL must not contain credentials.');
  }
  if (!['true', 'false', undefined].includes(input.VITE_ENABLE_MOCKS)) {
    throw new Error('VITE_ENABLE_MOCKS must be true or false.');
  }
  if (input.PROD && input.VITE_ENABLE_MOCKS === 'true') {
    throw new Error('Mocks are forbidden in production.');
  }
  return {
    apiBaseUrl,
    enableMocks: input.DEV && input.VITE_ENABLE_MOCKS === 'true',
  };
}

export const env = parseEnvironment(import.meta.env);
