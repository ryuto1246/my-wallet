/**
 * カテゴリー定数定義
 */

import { CategoryDefinition } from '@/types/category';

export const CATEGORIES: CategoryDefinition[] = [
  // 収入
  {
    main: '収入',
    subs: ['アルバイト', 'お小遣い', '立替金回収', 'その他'],
    isIncome: true,
  },
  
  // 食費
  {
    main: '食費',
    subs: ['自炊', '外食', '学食', '飲み会', '家族', 'おやつ・カフェ', 'その他'],
    isIncome: false,
  },
  
  // 生活
  {
    main: '生活',
    subs: ['日用品', '衣料品', '美容', '犬', '通信', '医療', 'その他'],
    isIncome: false,
  },
  
  // 仕事
  {
    main: '仕事',
    subs: ['Nectere', 'RADICA'],
    isIncome: false,
  },
  
  // 交通費
  {
    main: '交通費',
    subs: ['電車バス', '特急', '飛行機', '車', 'タクシー', 'その他'],
    isIncome: false,
  },
  
  // 学業教養
  {
    main: '学業教養',
    subs: ['教科書', '文房具', '資格', 'ソフトウェア', '学費', '書籍', '音楽', 'その他'],
    isIncome: false,
  },
  
  // 娯楽
  {
    main: '娯楽',
    subs: ['娯楽', '団体費', '交際', 'その他'],
    isIncome: false,
  },
  
  // その他
  {
    main: 'その他',
    subs: ['手数料', '立替', '借金返済', 'その他'],
    isIncome: false,
  },
];

/**
 * メインカテゴリー一覧を取得
 */
export const getMainCategories = (isIncome?: boolean): string[] => {
  if (isIncome === undefined) {
    return CATEGORIES.map(cat => cat.main);
  }
  return CATEGORIES.filter(cat => cat.isIncome === isIncome).map(cat => cat.main);
};

/**
 * サブカテゴリー一覧を取得
 */
export const getSubCategories = (mainCategory: string): string[] => {
  const category = CATEGORIES.find(cat => cat.main === mainCategory);
  return category?.subs || [];
};

/**
 * カテゴリーが収入かどうか判定
 */
export const isIncomeCategory = (mainCategory: string): boolean => {
  const category = CATEGORIES.find(cat => cat.main === mainCategory);
  return category?.isIncome || false;
};

/**
 * カテゴリーの検証
 */
export const isValidCategory = (mainCategory: string, subCategory: string): boolean => {
  const category = CATEGORIES.find(cat => cat.main === mainCategory);
  if (!category) return false;
  return category.subs.includes(subCategory);
};

