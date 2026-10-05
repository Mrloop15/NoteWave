import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/identity',
  workers: 1,
  retries: 0,
  timeout: 40_000,
  use: { baseURL: 'http://127.0.0.1:5174', trace: 'off' },
  projects: [{ name: 'identity', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node e2e/support/auth-server.mjs',
      url: 'http://127.0.0.1:8001/health/live',
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev -- --port 5174',
      url: 'http://127.0.0.1:5174',
      env: { API_PROXY_TARGET: 'http://127.0.0.1:8001' },
      reuseExistingServer: false,
    },
  ],
})
