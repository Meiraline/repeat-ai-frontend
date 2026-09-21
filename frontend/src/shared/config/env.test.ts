import { expect, it } from 'vitest';
import { parseEnvironment } from './env';
it('only enables explicit development mocks', () => {
  expect(parseEnvironment({ DEV: true, PROD: false }).enableMocks).toBe(false);
  expect(parseEnvironment({ DEV: true, PROD: false, VITE_ENABLE_MOCKS: 'true' }).enableMocks).toBe(
    true,
  );
  expect(() => parseEnvironment({ DEV: false, PROD: true, VITE_ENABLE_MOCKS: 'true' })).toThrow(
    'production',
  );
});
it.each(['//evil.test', 'https://user:password@example.com', '/api?token=x', 'api/v1'])(
  'rejects invalid API base %s',
  (url) => {
    expect(() => parseEnvironment({ DEV: true, PROD: false, VITE_API_BASE_URL: url })).toThrow();
  },
);
