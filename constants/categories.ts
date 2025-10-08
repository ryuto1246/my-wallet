/**
 * カテゴリー定数定義
 */

import { CategoryDefinition } from '@/types/category';

export const CATEGORIES: CategoryDefinition[] = [
  // 収入
  {
    main: '収入',
    subs: [
      'アルバイト・給与',
      'お小遣い・援助',
      '立替金回収',
      '投資・配当',
      '副業・フリーランス',
      'ポイント・キャッシュバック',
      'その他',
    ],
    isIncome: true,
  },
  
  // 食費
  {
    main: '食費',
    subs: [
      '自炊（食材購入）',
      'コンビニ',
      '外食（ランチ）',
      '外食（ディナー）',
      'カフェ・喫茶',
      'おやつ・スイーツ',
      '学食',
      '飲み会・宅飲み',
      'デリバリー',
      'その他',
    ],
    isIncome: false,
  },
  
  // 日用品・生活費
  {
    main: '日用品・生活費',
    subs: [
      '日用品・消耗品',
      '家具・インテリア',
      'キッチン用品',
      '掃除・洗濯用品',
      'バス・トイレ用品',
      'その他',
    ],
    isIncome: false,
  },
  
  // 衣料・美容
  {
    main: '衣料・美容',
    subs: [
      '衣類',
      '靴・バッグ',
      'アクセサリー・時計',
      '理美容（カット・カラー）',
      '化粧品・スキンケア',
      'クリーニング',
      'その他',
    ],
    isIncome: false,
  },
  
  // 健康・医療
  {
    main: '健康・医療',
    subs: [
      '病院・診療',
      '薬・サプリメント',
      'コンタクト・メガネ',
      'ジム・フィットネス',
      'その他',
    ],
    isIncome: false,
  },
  
  // 交通費
  {
    main: '交通費',
    subs: [
      '電車・バス（定期外）',
      '定期券',
      '新幹線・特急',
      '飛行機',
      'タクシー・代行',
      '車（ガソリン・駐車場）',
      '自転車・バイク',
      'その他',
    ],
    isIncome: false,
  },
  
  // 通信・サブスク
  {
    main: '通信・サブスク',
    subs: [
      '携帯電話',
      'インターネット',
      '動画配信（Netflix等）',
      '音楽配信（Spotify等）',
      'その他サブスク',
      'アプリ課金',
      'その他',
    ],
    isIncome: false,
  },
  
  // 教育・教養
  {
    main: '教育・教養',
    subs: [
      '教科書・参考書',
      '文房具',
      '学費・授業料',
      '資格・検定',
      'セミナー・講座',
      '書籍・雑誌',
      '新聞',
      'ソフトウェア・ツール',
      'その他',
    ],
    isIncome: false,
  },
  
  // 趣味・娯楽
  {
    main: '趣味・娯楽',
    subs: [
      '映画・演劇',
      'ゲーム',
      '音楽・ライブ',
      'スポーツ観戦',
      '旅行・レジャー',
      'カラオケ',
      '漫画・電子書籍',
      'ホビー・コレクション',
      'その他',
    ],
    isIncome: false,
  },
  
  // 交際費
  {
    main: '交際費',
    subs: [
      '飲み会',
      'デート',
      'プレゼント',
      '冠婚葬祭',
      '会費・団体費',
      'その他',
    ],
    isIncome: false,
  },
  
  // 住居
  {
    main: '住居',
    subs: [
      '家賃',
      '水道光熱費（電気）',
      '水道光熱費（ガス）',
      '水道光熱費（水道）',
      '更新料・保険',
      'その他',
    ],
    isIncome: false,
  },
  
  // ペット
  {
    main: 'ペット',
    subs: [
      'ペットフード',
      'ペット用品',
      '動物病院',
      'トリミング',
      'その他',
    ],
    isIncome: false,
  },
  
  // 仕事関連
  {
    main: '仕事関連',
    subs: [
      '事務用品',
      '書籍・資料',
      '会議・打ち合わせ',
      '名刺・印刷',
      'その他',
    ],
    isIncome: false,
  },
  
  // 振替
  {
    main: '振替',
    subs: [
      '口座間振替',
      '現金チャージ',
      '現金引き出し',
      'その他',
    ],
    isIncome: false,
  },

  // その他
  {
    main: 'その他',
    subs: [
      '手数料',
      '税金・保険',
      '立替',
      '返済',
      '寄付・募金',
      'その他',
    ],
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

/**
 * カテゴリーの総数を取得
 */
export const getCategoryCount = (): { total: number; income: number; expense: number } => {
  const income = CATEGORIES.filter(cat => cat.isIncome).length;
  const expense = CATEGORIES.filter(cat => !cat.isIncome).length;
  return {
    total: CATEGORIES.length,
    income,
    expense,
  };
};

/**
 * サブカテゴリーの総数を取得
 */
export const getSubCategoryCount = (mainCategory?: string): number => {
  if (mainCategory) {
    const category = CATEGORIES.find(cat => cat.main === mainCategory);
    return category?.subs.length || 0;
  }
  return CATEGORIES.reduce((sum, cat) => sum + cat.subs.length, 0);
};

/**
 * カテゴリー情報を取得
 */
export const getCategoryInfo = (mainCategory: string): CategoryDefinition | null => {
  return CATEGORIES.find(cat => cat.main === mainCategory) || null;
};

/**
 * 関連するカテゴリーを取得（同じメインカテゴリ内）
 */
export const getRelatedSubCategories = (
  mainCategory: string,
  currentSubCategory: string
): string[] => {
  const category = CATEGORIES.find(cat => cat.main === mainCategory);
  if (!category) return [];
  
  // 現在のサブカテゴリーを除外したリストを返す
  return category.subs.filter(sub => sub !== currentSubCategory);
};

/**
 * キーワードからカテゴリーを推測
 * AI学習の補助として使用
 */
export const suggestCategoriesByKeyword = (keyword: string): Array<{
  main: string;
  sub: string;
  isIncome: boolean;
}> => {
  const normalized = keyword.toLowerCase();
  const suggestions: Array<{ main: string; sub: string; isIncome: boolean }> = [];
  
  // キーワードマッピング
  const keywordMap: Record<string, Array<{ main: string; subs: string[] }>> = {
    'スーパー': [{ main: '食費', subs: ['自炊（食材購入）'] }],
    '食材': [{ main: '食費', subs: ['自炊（食材購入）'] }],
    'コンビニ': [{ main: '食費', subs: ['コンビニ'] }],
    'ランチ': [{ main: '食費', subs: ['外食（ランチ）', '学食'] }],
    'ディナー': [{ main: '食費', subs: ['外食（ディナー）'] }],
    '夕食': [{ main: '食費', subs: ['外食（ディナー）', '自炊（食材購入）'] }],
    '昼食': [{ main: '食費', subs: ['外食（ランチ）', '学食'] }],
    'カフェ': [{ main: '食費', subs: ['カフェ・喫茶'] }],
    'スターバックス': [{ main: '食費', subs: ['カフェ・喫茶'] }],
    'タリーズ': [{ main: '食費', subs: ['カフェ・喫茶'] }],
    '飲み会': [{ main: '食費', subs: ['飲み会・宅飲み'] }, { main: '交際費', subs: ['飲み会'] }],
    'デリバリー': [{ main: '食費', subs: ['デリバリー'] }],
    '電車': [{ main: '交通費', subs: ['電車・バス（定期外）'] }],
    'バス': [{ main: '交通費', subs: ['電車・バス（定期外）'] }],
    '定期': [{ main: '交通費', subs: ['定期券'] }],
    'タクシー': [{ main: '交通費', subs: ['タクシー・代行'] }],
    '新幹線': [{ main: '交通費', subs: ['新幹線・特急'] }],
    '飛行機': [{ main: '交通費', subs: ['飛行機'] }],
    'ガソリン': [{ main: '交通費', subs: ['車（ガソリン・駐車場）'] }],
    '駐車場': [{ main: '交通費', subs: ['車（ガソリン・駐車場）'] }],
    '服': [{ main: '衣料・美容', subs: ['衣類'] }],
    '靴': [{ main: '衣料・美容', subs: ['靴・バッグ'] }],
    '美容院': [{ main: '衣料・美容', subs: ['理美容（カット・カラー）'] }],
    '化粧品': [{ main: '衣料・美容', subs: ['化粧品・スキンケア'] }],
    '病院': [{ main: '健康・医療', subs: ['病院・診療'] }],
    '薬': [{ main: '健康・医療', subs: ['薬・サプリメント'] }],
    'ジム': [{ main: '健康・医療', subs: ['ジム・フィットネス'] }],
    '携帯': [{ main: '通信・サブスク', subs: ['携帯電話'] }],
    'Netflix': [{ main: '通信・サブスク', subs: ['動画配信（Netflix等）'] }],
    'Spotify': [{ main: '通信・サブスク', subs: ['音楽配信（Spotify等）'] }],
    '教科書': [{ main: '教育・教養', subs: ['教科書・参考書'] }],
    '文房具': [{ main: '教育・教養', subs: ['文房具'] }],
    '映画': [{ main: '趣味・娯楽', subs: ['映画・演劇'] }],
    'ゲーム': [{ main: '趣味・娯楽', subs: ['ゲーム'] }],
    'ライブ': [{ main: '趣味・娯楽', subs: ['音楽・ライブ'] }],
    '旅行': [{ main: '趣味・娯楽', subs: ['旅行・レジャー'] }],
    'プレゼント': [{ main: '交際費', subs: ['プレゼント'] }],
    '家賃': [{ main: '住居', subs: ['家賃'] }],
    '電気': [{ main: '住居', subs: ['水道光熱費（電気）'] }],
    'ガス': [{ main: '住居', subs: ['水道光熱費（ガス）'] }],
    '水道': [{ main: '住居', subs: ['水道光熱費（水道）'] }],
    'ペット': [{ main: 'ペット', subs: ['ペットフード', 'ペット用品'] }],
    '犬': [{ main: 'ペット', subs: ['ペットフード', 'ペット用品'] }],
    '猫': [{ main: 'ペット', subs: ['ペットフード', 'ペット用品'] }],
    'バイト': [{ main: '収入', subs: ['アルバイト・給与'] }],
    '給料': [{ main: '収入', subs: ['アルバイト・給与'] }],
  };
  
  // キーワードマッチング
  for (const [key, categoryList] of Object.entries(keywordMap)) {
    if (normalized.includes(key.toLowerCase())) {
      categoryList.forEach(catInfo => {
        const category = CATEGORIES.find(c => c.main === catInfo.main);
        if (category) {
          catInfo.subs.forEach(sub => {
            if (category.subs.includes(sub)) {
              suggestions.push({
                main: catInfo.main,
                sub: sub,
                isIncome: category.isIncome,
              });
            }
          });
        }
      });
    }
  }
  
  return suggestions;
};

