// Browsertests (Playwright) tegen de echte server + de gebouwde client (cd client && npm run build).
// Elk spec-bestand start zijn eigen server met testgegevens (server/test/helpers.js).
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    locale: 'nl-BE',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    serviceWorkers: 'block', // geen gecachte app tussen tests
  },
  projects: [{ name: 'gsm', use: { ...devices['Pixel 7'] } }],
});
