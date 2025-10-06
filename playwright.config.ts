import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2Eテスト設定
 * 詳細: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  // 並列実行の設定
  fullyParallel: true,
  
  // CI環境でのみ失敗時にリトライ
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  
  // 並列ワーカー数
  workers: process.env.CI ? 1 : undefined,
  
  // レポーター設定
  reporter: 'html',
  
  // 共通設定
  use: {
    // ベースURL
    baseURL: 'http://localhost:3000',
    
    // スクリーンショット設定
    screenshot: 'only-on-failure',
    
    // トレース設定
    trace: 'on-first-retry',
  },
  
  // テスト対象のブラウザ設定
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // モバイルブラウザ
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  // 開発サーバーの起動
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});

