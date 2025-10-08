/**
 * カテゴリー定数のユニットテスト
 */

import { describe, it, expect } from 'vitest';
import {
  CATEGORIES,
  getMainCategories,
  getSubCategories,
  isIncomeCategory,
  isValidCategory,
} from '@/constants/categories';

describe('Categories Constants', () => {
  describe('CATEGORIES', () => {
    it('収入カテゴリーが定義されている', () => {
      const incomeCategory = CATEGORIES.find(cat => cat.main === '収入');
      expect(incomeCategory).toBeDefined();
      expect(incomeCategory?.isIncome).toBe(true);
    });

    it('すべてのカテゴリーにサブカテゴリーが存在する', () => {
      CATEGORIES.forEach(category => {
        expect(category.subs.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getMainCategories', () => {
    it('全メインカテゴリーを取得できる', () => {
      const mainCategories = getMainCategories();
      expect(mainCategories.length).toBeGreaterThan(0);
      expect(mainCategories).toContain('収入');
      expect(mainCategories).toContain('食費');
    });

    it('収入カテゴリーのみを取得できる', () => {
      const incomeCategories = getMainCategories(true);
      expect(incomeCategories).toContain('収入');
      expect(incomeCategories.length).toBe(1);
    });

    it('支出カテゴリーのみを取得できる', () => {
      const expenseCategories = getMainCategories(false);
      expect(expenseCategories).not.toContain('収入');
      expect(expenseCategories.length).toBeGreaterThan(0);
    });
  });

  describe('getSubCategories', () => {
    it('収入のサブカテゴリーを取得できる', () => {
      const subs = getSubCategories('収入');
      expect(subs).toContain('アルバイト・給与');
      expect(subs).toContain('お小遣い・援助');
    });

    it('存在しないカテゴリーの場合は空配列を返す', () => {
      const subs = getSubCategories('存在しないカテゴリー');
      expect(subs).toEqual([]);
    });
  });

  describe('isIncomeCategory', () => {
    it('収入カテゴリーはtrueを返す', () => {
      expect(isIncomeCategory('収入')).toBe(true);
    });

    it('支出カテゴリーはfalseを返す', () => {
      expect(isIncomeCategory('食費')).toBe(false);
    });
  });

  describe('isValidCategory', () => {
    it('有効なカテゴリー組み合わせはtrueを返す', () => {
      expect(isValidCategory('収入', 'アルバイト・給与')).toBe(true);
      expect(isValidCategory('食費', '自炊（食材購入）')).toBe(true);
    });

    it('無効なカテゴリー組み合わせはfalseを返す', () => {
      expect(isValidCategory('収入', '自炊（食材購入）')).toBe(false);
      expect(isValidCategory('存在しない', 'サブ')).toBe(false);
    });
  });

  describe('getCategoryCount', () => {
    it('カテゴリーの総数を取得できる', async () => {
      const { getCategoryCount } = await import('@/constants/categories');
      const count = getCategoryCount();
      expect(count.total).toBeGreaterThan(0);
      expect(count.income).toBeGreaterThan(0);
      expect(count.expense).toBeGreaterThan(0);
      expect(count.total).toBe(count.income + count.expense);
    });
  });

  describe('getSubCategoryCount', () => {
    it('全サブカテゴリーの総数を取得できる', async () => {
      const { getSubCategoryCount } = await import('@/constants/categories');
      const count = getSubCategoryCount();
      expect(count).toBeGreaterThan(0);
    });

    it('特定のメインカテゴリーのサブカテゴリー数を取得できる', async () => {
      const { getSubCategoryCount } = await import('@/constants/categories');
      const count = getSubCategoryCount('食費');
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('getCategoryInfo', () => {
    it('カテゴリー情報を取得できる', async () => {
      const { getCategoryInfo } = await import('@/constants/categories');
      const info = getCategoryInfo('食費');
      expect(info).toBeDefined();
      expect(info?.main).toBe('食費');
      expect(info?.subs).toBeDefined();
      expect(info?.isIncome).toBe(false);
    });

    it('存在しないカテゴリーはnullを返す', async () => {
      const { getCategoryInfo } = await import('@/constants/categories');
      const info = getCategoryInfo('存在しない');
      expect(info).toBeNull();
    });
  });

  describe('getRelatedSubCategories', () => {
    it('関連するサブカテゴリーを取得できる', async () => {
      const { getRelatedSubCategories } = await import('@/constants/categories');
      const related = getRelatedSubCategories('食費', '自炊（食材購入）');
      expect(related).toBeDefined();
      expect(related).not.toContain('自炊（食材購入）');
      expect(related.length).toBeGreaterThan(0);
    });
  });

  describe('suggestCategoriesByKeyword', () => {
    it('キーワードから適切なカテゴリーを提案する', async () => {
      const { suggestCategoriesByKeyword } = await import('@/constants/categories');
      
      // カフェ関連のキーワード
      const cafeSuggestions = suggestCategoriesByKeyword('スターバックス');
      expect(cafeSuggestions.length).toBeGreaterThan(0);
      expect(cafeSuggestions.some(s => s.sub === 'カフェ・喫茶')).toBe(true);
      
      // 交通費関連のキーワード
      const trainSuggestions = suggestCategoriesByKeyword('電車');
      expect(trainSuggestions.length).toBeGreaterThan(0);
      expect(trainSuggestions.some(s => s.main === '交通費')).toBe(true);
      
      // 収入関連のキーワード
      const incomeSuggestions = suggestCategoriesByKeyword('バイト');
      expect(incomeSuggestions.length).toBeGreaterThan(0);
      expect(incomeSuggestions.some(s => s.isIncome === true)).toBe(true);
    });

    it('マッチしないキーワードは空配列を返す', async () => {
      const { suggestCategoriesByKeyword } = await import('@/constants/categories');
      const suggestions = suggestCategoriesByKeyword('あいうえお12345');
      expect(suggestions).toEqual([]);
    });
  });
});

