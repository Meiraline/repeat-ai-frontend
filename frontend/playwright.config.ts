import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  outputDir: './test-results/dev',
  fullyParallel: true,
  workers: 2,
  retries: 0,
  use: { baseURL: 'http://127.0.0.1:3000', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run dev:mock',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: false,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: process.env.PLAYWRIGHT_CHANNEL },
    },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'] } },
    {
      name: 'narrow-chromium',
      use: {
        browserName: 'chromium',
        channel: process.env.PLAYWRIGHT_CHANNEL,
        viewport: { width: 320, height: 740 },
      },
    },
  ],
});
