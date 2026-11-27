import { defineConfig } from '@playwright/test';

import { applyE2eEnv } from './tests/e2e/env';

applyE2eEnv();

function serverEnv(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
}

const baseURL = 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: 'tests/e2e/journeys',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTimeout: 180_000,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: 2,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: 'line',
  outputDir: 'test-results',
  use: {
    baseURL,
    browserName: 'chromium',
    viewport: { width: 1280, height: 720 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm start',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: serverEnv(),
  },
  projects: [
    {
      name: 'setup',
      testMatch: /01-talent-signin\.spec\.ts/,
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      testIgnore: /01-talent-signin\.spec\.ts/,
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
});
