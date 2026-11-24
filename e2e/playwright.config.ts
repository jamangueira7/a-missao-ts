import { defineConfig, devices } from '@playwright/test';

// SCREENSHOT=1 (make screenshot) roda só o print do README; sem ele, só os testes de verdade.
const screenshot = Boolean(process.env.SCREENSHOT);

export default defineConfig({
  testDir: '.',
  testMatch: screenshot ? 'screenshot.spec.ts' : 'jogo.spec.ts',
  workers: 1,
  retries: 0,
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://web:5173',
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
