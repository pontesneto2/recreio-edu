import { defineConfig, devices } from '@playwright/test';

const PORTA = 4273;

/**
 * E2E do portal contra o build de produção (`vite preview`), sem backend.
 * A API vem do `page.route` (`e2e/fixtures.ts`). O `--mode api-falsa` cobre o que o service worker busca.
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { outputFolder: 'playwright-report', open: 'never' }]] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${PORTA}`,
    locale: 'pt-BR',
    trace: 'retain-on-failure',
    // O `page.route` não vê o que passa pelo service worker. Só o teste de PWA liga o service worker.
    serviceWorkers: 'block',
  },
  webServer: {
    command: `vite preview --mode api-falsa --port ${PORTA} --strictPort`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: !process.env.CI,
  },
});
