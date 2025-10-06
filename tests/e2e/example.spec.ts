/**
 * E2Eテストのサンプル
 * 後で実際の機能テストに置き換える
 */

import { test, expect } from '@playwright/test';

test.describe('ホームページ', () => {
  test('ページが正常に表示される', async ({ page }) => {
    await page.goto('/');
    
    // ページタイトルを確認
    await expect(page).toHaveTitle(/Smart Wallet|Next/);
  });
});

