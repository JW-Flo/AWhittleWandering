import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E smoke test configuration.
 *
 * By default, tests run against a local Vite preview server (`npm run preview`).
 * To test a deployed preview URL, set the E2E_BASE_URL environment variable:
 *
 *   E2E_BASE_URL=https://pr-42.awhittlewandering.pages.dev npx playwright test
 */
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:4173';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 30_000,

  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Start a local preview server when no E2E_BASE_URL is set */
  ...(process.env.E2E_BASE_URL
    ? {}
    : {
        webServer: {
          command: 'npm run preview',
          url: 'http://localhost:4173',
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      }),
});
