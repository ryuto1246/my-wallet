/**
 * カテゴリー関連の型定義
 */

export interface Category {
  main: string;
  sub: string;
}

export interface CategoryDefinition {
  main: string;
  subs: string[];
  isIncome: boolean;
}

export const CategoryType = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const;

export type CategoryTypeValue = typeof CategoryType[keyof typeof CategoryType];

