import { defineConfig, devices } from '@playwright/test'

// Browser checks with no backend (§3.6): they run against the production image, the BFF stubbed.
// Flows through the running stack live in fintrace-tests.
export default defineConfig({
  testDir: 'perf',
  // Timings measured side by side would slow each other down
  workers: 1,
  fullyParallel: false,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    baseURL: process.env.WEB_URL ?? 'http://localhost:8080',
    ...devices['Pixel 7'],
  },
})
