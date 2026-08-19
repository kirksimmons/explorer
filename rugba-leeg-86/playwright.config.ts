import { defineConfig, devices } from '@playwright/test';

// E2E runs against the BUILT single file over file:// — the real deliverable.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    trace: 'off',
    launchOptions: { executablePath: '/opt/pw-browsers/chromium' },
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'phone-landscape',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 844, height: 390 },
        hasTouch: true,
      },
    },
  ],
});
