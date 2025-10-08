/**
 * 項目名（description）のテンプレート定義
 * AIサジェスチョンで使用する構造化された項目名のフォーマット
 */

export interface DescriptionTemplate {
  category: string; // メインカテゴリー
  subCategory?: string; // サブカテゴリー（省略可能）
  templates: string[]; // テンプレートの例
  format: string; // フォーマット説明
}

export const DESCRIPTION_TEMPLATES: DescriptionTemplate[] = [
  // 食費
  {
    category: '食費',
    subCategory: '自炊（食材購入）',
    templates: [
      'スーパー（オオゼキ）で食材購入',
      'スーパーで野菜・肉購入',
      'スーパー（店名）で買い物',
    ],
    format: 'スーパー（店舗名）で食材購入',
  },
  {
    category: '食費',
    subCategory: 'コンビニ',
    templates: [
      'コンビニ（セブンイレブン）で購入',
      'ローソンで飲み物',
      'ファミマでおにぎり',
    ],
    format: 'コンビニ（店舗名）で購入',
  },
  {
    category: '食費',
    subCategory: '外食（ランチ）',
    templates: [
      'レストラン（サイゼリヤ）でランチ',
      '松屋でランチセット',
      'カフェでランチ',
    ],
    format: 'レストラン（店名）でランチ',
  },
  {
    category: '食費',
    subCategory: '外食（ディナー）',
    templates: [
      'レストラン（店名）でディナー',
      '居酒屋で夕食',
      'レストランで夕食',
    ],
    format: 'レストラン（店名）でディナー',
  },
  {
    category: '食費',
    subCategory: 'カフェ・喫茶',
    templates: [
      'カフェ（スターバックス）でコーヒー',
      'タリーズでラテ',
      'カフェで作業',
    ],
    format: 'カフェ（店名）でコーヒー',
  },
  {
    category: '食費',
    subCategory: 'デリバリー',
    templates: [
      'デリバリー（Uber Eats）でピザ',
      '出前館で寿司',
      'デリバリーで夕食',
    ],
    format: 'デリバリー（サービス名）で注文',
  },
  {
    category: '食費',
    subCategory: '飲み会・宅飲み',
    templates: [
      '居酒屋（店名）で飲み会',
      '友人と飲み会',
      'サークルで飲み会',
    ],
    format: '居酒屋（店名）で飲み会',
  },

  // 交通費
  {
    category: '交通費',
    subCategory: '電車・バス（定期外）',
    templates: [
      '電車（JR）：渋谷→新宿',
      'バス：自宅→駅',
      '地下鉄：表参道→六本木',
    ],
    format: '電車（路線名）：出発駅→到着駅',
  },
  {
    category: '交通費',
    subCategory: 'タクシー・代行',
    templates: [
      'タクシー：渋谷→自宅',
      'タクシーで帰宅',
      '代行サービス利用',
    ],
    format: 'タクシー：出発地→目的地',
  },
  {
    category: '交通費',
    subCategory: '定期券',
    templates: [
      '定期券（JR 渋谷〜新宿）購入',
      '通学定期購入',
      '定期券更新',
    ],
    format: '定期券（路線名・区間）購入',
  },
  {
    category: '交通費',
    subCategory: '新幹線・特急',
    templates: [
      '新幹線（のぞみ）：東京→大阪',
      '特急：新宿→長野',
      '新幹線チケット購入',
    ],
    format: '新幹線（列車名）：出発駅→到着駅',
  },
  {
    category: '交通費',
    subCategory: '飛行機',
    templates: [
      '航空券（ANA）：羽田→福岡',
      'JAL 成田→札幌',
      '飛行機チケット',
    ],
    format: '航空券（航空会社）：出発地→目的地',
  },

  // 通信・サブスク
  {
    category: '通信・サブスク',
    subCategory: '携帯電話',
    templates: [
      '携帯料金（docomo）',
      'au 月額料金',
      'ソフトバンク 通信費',
    ],
    format: '携帯料金（キャリア名）',
  },
  {
    category: '通信・サブスク',
    subCategory: '動画配信（Netflix等）',
    templates: [
      'Netflix 月額料金',
      'Amazon Prime Video サブスク',
      'Disney+ 月額',
    ],
    format: 'サービス名 月額料金',
  },
  {
    category: '通信・サブスク',
    subCategory: '音楽配信（Spotify等）',
    templates: [
      'Spotify Premium',
      'Apple Music サブスク',
      'YouTube Music 月額',
    ],
    format: 'サービス名 月額料金',
  },

  // 衣料・美容
  {
    category: '衣料・美容',
    subCategory: '衣類',
    templates: [
      'ユニクロでTシャツ購入',
      'GUでジーンズ',
      'ZARA で服購入',
    ],
    format: '店舗名で商品名購入',
  },
  {
    category: '衣料・美容',
    subCategory: '理美容（カット・カラー）',
    templates: [
      '美容院（店名）でカット',
      '理容室でカラー',
      'ヘアサロンでカット',
    ],
    format: '美容院（店名）でカット',
  },

  // 健康・医療
  {
    category: '健康・医療',
    subCategory: '病院・診療',
    templates: [
      '病院（◯◯内科）で診察',
      '歯科で治療',
      'クリニックで診察',
    ],
    format: '病院名で診察',
  },
  {
    category: '健康・医療',
    subCategory: '薬・サプリメント',
    templates: [
      '薬局で風邪薬購入',
      'サプリメント購入',
      '処方箋薬',
    ],
    format: '薬局で薬購入',
  },
  {
    category: '健康・医療',
    subCategory: 'ジム・フィットネス',
    templates: [
      'ジム（◯◯）月会費',
      'フィットネスクラブ 月額',
      'ヨガ教室 月謝',
    ],
    format: 'ジム（店名）月会費',
  },

  // 教育・教養
  {
    category: '教育・教養',
    subCategory: '書籍・雑誌',
    templates: [
      'プログラミング入門書',
      '技術書購入',
      '雑誌購入',
    ],
    format: '書籍名',
  },
  {
    category: '教育・教養',
    subCategory: 'セミナー・講座',
    templates: [
      'Udemy オンライン講座',
      'プログラミングスクール 受講料',
      'セミナー参加費',
    ],
    format: 'サービス名 講座',
  },
  {
    category: '教育・教養',
    subCategory: '資格・検定',
    templates: [
      'TOEIC 受験料',
      '英検 受験費',
      '資格試験 受験料',
    ],
    format: '試験名 受験料',
  },

  // 趣味・娯楽
  {
    category: '趣味・娯楽',
    subCategory: '映画・演劇',
    templates: [
      '映画（作品名）鑑賞',
      '映画チケット',
      '演劇鑑賞',
    ],
    format: '映画（作品名）鑑賞',
  },
  {
    category: '趣味・娯楽',
    subCategory: 'ゲーム',
    templates: [
      'ゲーム（ゼルダの伝説）購入',
      'Nintendo Switch ゲーム',
      'PS5 ソフト',
    ],
    format: 'ゲーム（タイトル）購入',
  },
  {
    category: '趣味・娯楽',
    subCategory: '音楽・ライブ',
    templates: [
      'ライブ（アーティスト名）チケット',
      'コンサート鑑賞',
      '音楽イベント',
    ],
    format: 'ライブ（アーティスト名）チケット',
  },
  {
    category: '趣味・娯楽',
    subCategory: '旅行・レジャー',
    templates: [
      '旅行（箱根）宿泊費',
      'ホテル予約',
      '温泉旅行',
    ],
    format: '旅行（目的地）',
  },

  // 交際費
  {
    category: '交際費',
    subCategory: '飲み会',
    templates: [
      '友人と飲み会',
      'サークルで飲み会',
      '同僚と飲み会',
    ],
    format: '相手名と飲み会',
  },
  {
    category: '交際費',
    subCategory: 'プレゼント',
    templates: [
      'プレゼント（誕生日）',
      '友人へのプレゼント',
      'ギフト購入',
    ],
    format: 'プレゼント（品名）',
  },
  {
    category: '交際費',
    subCategory: 'デート',
    templates: [
      '映画デート',
      '友人とデート',
      'デート費用',
    ],
    format: '相手名とデート',
  },

  // 収入
  {
    category: '収入',
    subCategory: 'アルバイト・給与',
    templates: [
      'アルバイト（◯◯カフェ）給与',
      'バイト代',
      '給与振込',
    ],
    format: 'アルバイト（勤務先）給与',
  },
  {
    category: '収入',
    subCategory: 'お小遣い・援助',
    templates: [
      '親からお小遣い',
      'お小遣い',
      '仕送り',
    ],
    format: 'お小遣い（送り主）',
  },
  {
    category: '収入',
    subCategory: '副業・フリーランス',
    templates: [
      '副業（案件名）報酬',
      'フリーランス報酬',
      'Web制作 報酬',
    ],
    format: '副業（案件名）報酬',
  },

  // 住居
  {
    category: '住居',
    subCategory: '家賃',
    templates: [
      '家賃（物件名）',
      '月の家賃',
      '賃貸料',
    ],
    format: '家賃（物件名）',
  },
  {
    category: '住居',
    subCategory: '水道光熱費（電気）',
    templates: [
      '電気代（10月）',
      '10月分 電気代',
      '電気料金',
    ],
    format: '電気代（月）',
  },
  {
    category: '住居',
    subCategory: '水道光熱費（ガス）',
    templates: [
      'ガス代（10月）',
      '10月分 ガス代',
      'ガス料金',
    ],
    format: 'ガス代（月）',
  },
];

/**
 * カテゴリーとサブカテゴリーに基づいてテンプレートを取得
 */
export const getTemplateForCategory = (
  mainCategory: string,
  subCategory: string
): DescriptionTemplate | undefined => {
  return DESCRIPTION_TEMPLATES.find(
    (t) => t.category === mainCategory && t.subCategory === subCategory
  );
};

/**
 * すべてのテンプレート例を取得
 */
export const getAllTemplateExamples = (): string[] => {
  return DESCRIPTION_TEMPLATES.flatMap((t) => t.templates);
};

/**
 * テンプレートのフォーマット説明を取得
 */
export const getTemplateFormat = (
  mainCategory: string,
  subCategory: string
): string | undefined => {
  const template = getTemplateForCategory(mainCategory, subCategory);
  return template?.format;
};

/**
 * カテゴリー別のテンプレートをグループ化
 */
export const getTemplatesByCategory = (): Map<string, DescriptionTemplate[]> => {
  const grouped = new Map<string, DescriptionTemplate[]>();
  
  DESCRIPTION_TEMPLATES.forEach((template) => {
    const existing = grouped.get(template.category) || [];
    existing.push(template);
    grouped.set(template.category, existing);
  });
  
  return grouped;
};

