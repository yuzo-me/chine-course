import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: 'tests/e2e', timeout: 30000, retries: 0,
  use: { baseURL: 'http://127.0.0.1:4173', launchOptions: {} },
  projects: [
    { name: 'mobile', use: { viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: { command: 'npm run build && npx vite preview --port 4173 --host 127.0.0.1', url: 'http://127.0.0.1:4173', reuseExistingServer: true, timeout: 120000 },
})
