import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const installedWindowsChrome = process.platform === 'win32' && [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ...(process.env.LOCALAPPDATA ? [join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe')] : [])
].some(path => existsSync(path));

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
    channel: process.env.CUENTICO_BROWSER || (installedWindowsChrome ? 'chrome' : undefined),
    viewport: { width: 390, height: 844 }
  },
  webServer: {
    command: `"${process.execPath}" tests/start-server.mjs`,
    ...(process.env.CUENTICO_E2E_DEV === '1' ? { wait: { stdout: /Cuentico listo:/ } } : { url: 'http://127.0.0.1:3100/api/app' }),
    reuseExistingServer: false,
    timeout: 180_000
  }
});
