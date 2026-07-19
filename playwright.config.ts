import { defineConfig } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000'

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: 'test-results/playwright',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['github'], ['line']] : [['line']],
  use: {
    baseURL,
    colorScheme: 'dark',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm start',
    url: `${baseURL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
