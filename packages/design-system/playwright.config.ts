import { defineConfig, devices } from '@playwright/test';

const PORTA = 6106;

/** Passa o axe em cada história do Storybook já gerado (`npm run build-storybook`). */
export default defineConfig({
  testDir: './a11y',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { outputFolder: 'playwright-report', open: 'never' }]] : 'list',
  use: { baseURL: `http://localhost:${PORTA}`, ...devices['Desktop Chrome'] },
  webServer: {
    command: `vite preview --outDir storybook-static --port ${PORTA} --strictPort`,
    url: `http://localhost:${PORTA}/index.json`,
    reuseExistingServer: !process.env.CI,
  },
});
