import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/design-system',
  outputDir: './test-results/storybook',
  fullyParallel: true,
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:6006', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run storybook -- --ci',
    url: 'http://127.0.0.1:6006',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    {
      name: 'narrow-chromium',
      use: { browserName: 'chromium', viewport: { width: 320, height: 740 } },
    },
  ],
});
