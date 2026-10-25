import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 3,
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium', screenshot: 'only-on-failure' },
  projects: [
    { name: 'movil-360', use: { viewport: { width: 360, height: 800 } } },
    { name: 'movil-375', use: { viewport: { width: 375, height: 812 } } },
    { name: 'escritorio', use: { viewport: { width: 1280, height: 900 } } },
  ],
  webServer: { command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
})
