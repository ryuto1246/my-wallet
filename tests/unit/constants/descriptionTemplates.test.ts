/**
 * 項目名テンプレート定数のユニットテスト
 */

import { describe, it, expect } from 'vitest';
import {
  DESCRIPTION_TEMPLATES,
  getTemplateForCategory,
  getAllTemplateExamples,
  getTemplateFormat,
  getTemplatesByCategory,
} from '@/constants/descriptionTemplates';

describe('Description Templates Constants', () => {
  describe('DESCRIPTION_TEMPLATES', () => {
    it('テンプレートが定義されている', () => {
      expect(DESCRIPTION_TEMPLATES).toBeDefined();
      expect(DESCRIPTION_TEMPLATES.length).toBeGreaterThan(0);
    });

    it('各テンプレートに必須フィールドが存在する', () => {
      DESCRIPTION_TEMPLATES.forEach((template) => {
        expect(template.category).toBeDefined();
        expect(template.templates).toBeDefined();
        expect(template.templates.length).toBeGreaterThan(0);
        expect(template.format).toBeDefined();
      });
    });

    it('食費カテゴリーのテンプレートが存在する', () => {
      const foodTemplates = DESCRIPTION_TEMPLATES.filter(
        (t) => t.category === '食費'
      );
      expect(foodTemplates.length).toBeGreaterThan(0);
    });

    it('交通費カテゴリーのテンプレートが存在する', () => {
      const transportTemplates = DESCRIPTION_TEMPLATES.filter(
        (t) => t.category === '交通費'
      );
      expect(transportTemplates.length).toBeGreaterThan(0);
    });

    it('収入カテゴリーのテンプレートが存在する', () => {
      const incomeTemplates = DESCRIPTION_TEMPLATES.filter(
        (t) => t.category === '収入'
      );
      expect(incomeTemplates.length).toBeGreaterThan(0);
    });
  });

  describe('getTemplateForCategory', () => {
    it('指定したカテゴリーのテンプレートを取得できる', () => {
      const template = getTemplateForCategory('食費', '自炊（食材購入）');
      expect(template).toBeDefined();
      expect(template?.category).toBe('食費');
      expect(template?.subCategory).toBe('自炊（食材購入）');
    });

    it('存在しないカテゴリーはundefinedを返す', () => {
      const template = getTemplateForCategory('存在しない', 'サブ');
      expect(template).toBeUndefined();
    });

    it('交通費のテンプレートを取得できる', () => {
      const template = getTemplateForCategory(
        '交通費',
        '電車・バス（定期外）'
      );
      expect(template).toBeDefined();
      expect(template?.format).toContain('電車');
    });
  });

  describe('getAllTemplateExamples', () => {
    it('すべてのテンプレート例を取得できる', () => {
      const examples = getAllTemplateExamples();
      expect(examples.length).toBeGreaterThan(0);
      expect(Array.isArray(examples)).toBe(true);
    });

    it('テンプレート例に「スーパー」が含まれる', () => {
      const examples = getAllTemplateExamples();
      const hasSuper = examples.some((ex) => ex.includes('スーパー'));
      expect(hasSuper).toBe(true);
    });

    it('テンプレート例に「カフェ」が含まれる', () => {
      const examples = getAllTemplateExamples();
      const hasCafe = examples.some((ex) => ex.includes('カフェ'));
      expect(hasCafe).toBe(true);
    });
  });

  describe('getTemplateFormat', () => {
    it('指定したカテゴリーのフォーマットを取得できる', () => {
      const format = getTemplateFormat('食費', '自炊（食材購入）');
      expect(format).toBeDefined();
      expect(format).toContain('スーパー');
    });

    it('存在しないカテゴリーはundefinedを返す', () => {
      const format = getTemplateFormat('存在しない', 'サブ');
      expect(format).toBeUndefined();
    });

    it('交通費のフォーマットを取得できる', () => {
      const format = getTemplateFormat('交通費', '電車・バス（定期外）');
      expect(format).toBeDefined();
      expect(format).toContain('→');
    });
  });

  describe('getTemplatesByCategory', () => {
    it('カテゴリー別にグループ化されたテンプレートを取得できる', () => {
      const grouped = getTemplatesByCategory();
      expect(grouped.size).toBeGreaterThan(0);
      expect(grouped.has('食費')).toBe(true);
    });

    it('食費カテゴリーに複数のテンプレートが存在する', () => {
      const grouped = getTemplatesByCategory();
      const foodTemplates = grouped.get('食費');
      expect(foodTemplates).toBeDefined();
      expect(foodTemplates!.length).toBeGreaterThan(1);
    });

    it('各カテゴリーのテンプレートが正しくグループ化されている', () => {
      const grouped = getTemplatesByCategory();
      grouped.forEach((templates, category) => {
        templates.forEach((template) => {
          expect(template.category).toBe(category);
        });
      });
    });
  });

  describe('Template Structure', () => {
    it('スーパーのテンプレートに店舗名の括弧が含まれる', () => {
      const template = getTemplateForCategory('食費', '自炊（食材購入）');
      expect(template?.format).toContain('（');
      expect(template?.format).toContain('）');
    });

    it('電車のテンプレートに矢印記号が含まれる', () => {
      const template = getTemplateForCategory(
        '交通費',
        '電車・バス（定期外）'
      );
      expect(template?.format).toContain('→');
    });

    it('サブスクのテンプレートに「月額」が含まれる', () => {
      const template = getTemplateForCategory(
        '通信・サブスク',
        '動画配信（Netflix等）'
      );
      expect(template?.format).toContain('月額');
    });

    it('各テンプレートの例が20文字以内', () => {
      const examples = getAllTemplateExamples();
      examples.forEach((example) => {
        expect(example.length).toBeLessThanOrEqual(30);
      });
    });
  });
});

