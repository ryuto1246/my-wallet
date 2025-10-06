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
      expect(subs).toContain('アルバイト');
      expect(subs).toContain('お小遣い');
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
      expect(isValidCategory('収入', 'アルバイト')).toBe(true);
      expect(isValidCategory('食費', '自炊')).toBe(true);
    });

    it('無効なカテゴリー組み合わせはfalseを返す', () => {
      expect(isValidCategory('収入', '自炊')).toBe(false);
      expect(isValidCategory('存在しない', 'サブ')).toBe(false);
    });
  });
});

