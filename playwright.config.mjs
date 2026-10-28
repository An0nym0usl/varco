import { defineConfig, devices } from '@playwright/test';

// Local test server (4175) is built with a sandbox payment config; the fixture server (4180) plays
// the role of a third-party website for the bookmarklet test (different origin).
const PORT = 4175;
const FIXTURE_PORT = 4180;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure', locale: 'it-IT' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: /responsive\.spec/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /responsive\.spec/ },
  ],
  webServer: [
    {
      command: 'node scripts/build.mjs && node scripts/serve.mjs',
      url: `http://127.0.0.1:${PORT}/varco/`,
      env: { VARCO_ORIGIN: `http://127.0.0.1:${PORT}`, VARCO_CONFIG: 'tests/fixtures/config.test.json', PORT: String(PORT) },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'node scripts/serve.mjs',
      url: `http://127.0.0.1:${FIXTURE_PORT}/fixture.html`,
      env: { SERVE_ROOT: 'tests/fixtures', VARCO_BASE: '', PORT: String(FIXTURE_PORT) },
      reuseExistingServer: false,
    },
  ],
});
