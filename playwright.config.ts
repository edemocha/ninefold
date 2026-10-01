import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;

/**
 * End-to-end tests run against the production static export, served the way a
 * static host would. Build first: npm run build
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    locale: 'en-GB',
    colorScheme: 'light',
    timezoneId: 'Europe/London',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx serve apps/web/out -l ${PORT} --no-request-logging`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
