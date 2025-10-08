/**
 * AI サジェスチョン機能
 */

import { getGeminiModel } from './config';
import { Category } from '@/types/category';
import { CATEGORIES } from '@/constants/categories';

export interface SuggestionContext {
  amount?: number;
  paymentMethod?: string;
  timeOfDay?: string;
  dayOfWeek?: string;
  isIncome?: boolean;
}

export interface AISuggestion {
  category: Category;
  description: string;
  isIncome: boolean; // 収入か支出か
  confidence: number; // 0-1の確信度
  hasAdvance?: boolean; // 立替があるか
  advanceType?: 'friend' | 'parent' | null; // 立替タイプ
  advanceAmount?: number; // 立替金額（金額の何%か）
}

/**
 * カテゴリーと項目名のAIサジェスチョンを複数パターン取得
 */
export const getMultipleAISuggestions = async (
  inputText: string,
  context?: SuggestionContext
): Promise<AISuggestion[]> => {
  const model = getGeminiModel();
  
  if (!model || !inputText.trim()) {
    return [];
  }

  try {
    // 全カテゴリーをリスト化（収入・支出の両方）
    const categoryList = CATEGORIES
      .map(cat => `- ${cat.isIncome ? '【収入】' : '【支出】'}${cat.main}: ${cat.subs.join(', ')}`)
      .join('\n');

    const contextInfo = context ? `
コンテキスト情報:
- 金額: ${context.amount ? `${context.amount}円` : '不明'}
- 決済方法: ${context.paymentMethod || '不明'}
- 時間帯: ${context.timeOfDay || '不明'}
- 曜日: ${context.dayOfWeek || '不明'}
` : '';

    const prompt = `あなたは家計簿アプリのアシスタントです。ユーザーの入力から、それが収入か支出か、立替があるかを判定し、適切なカテゴリーと項目名を1〜5パターン提案してください。入力内容に応じて適切な数の提案をしてください（目安は3パターン程度）。

**重要: カテゴリー名は以下のリストから完全一致で選択してください（一字一句正確に）**

利用可能なカテゴリー:
${categoryList}

**カテゴリー選択のヒント:**
- 食費: 購入場所や時間帯で細かく分類（スーパー→自炊、コンビニ→コンビニ、昼のレストラン→外食（ランチ）、夜の飲食→外食（ディナー）、カフェ→カフェ・喫茶）
- 交通費: 定期的か臨時かで区別（定期券 vs 電車・バス（定期外））、移動手段の種類も考慮
- 通信・サブスク: 月額サービスを明確に分類（携帯、ネット、Netflix、Spotify等）
- 衣料・美容: 購入品の種類で細分化（衣類、靴・バッグ、化粧品、理美容）
- 教育・教養: 用途で分類（教科書、ソフトウェア、資格、書籍）
- 趣味・娯楽: 具体的なジャンルで分類（映画、ゲーム、音楽、旅行等）
- 住居: 光熱費は種類別に分類（電気、ガス、水道）

入力テキスト: "${inputText}"
${contextInfo}

以下のJSON形式で提案を配列で回答してください（JSON以外の文字は含めないでください）:
[
  {
    "isIncome": false,
    "mainCategory": "メインカテゴリー名",
    "subCategory": "サブカテゴリー名",
    "description": "わかりやすい項目名（20文字以内）",
    "confidence": 0.85,
    "hasAdvance": false,
    "advanceType": null,
    "advanceRatio": 0
  },
  ...
]

**項目名のテンプレート（descriptionの書き方）:**

項目名は以下のテンプレートに従って、構造化されたわかりやすい形式で作成してください。

**食費系:**
- 自炊（食材購入）: 「スーパー（店舗名）で食材購入」「スーパーで野菜・肉購入」
- コンビニ: 「コンビニ（店舗名）で購入」「セブンイレブンで飲み物」
- 外食（ランチ）: 「レストラン（店名）でランチ」「◯◯でランチセット」
- 外食（ディナー）: 「レストラン（店名）でディナー」「◯◯で夕食」
- カフェ・喫茶: 「カフェ（店名）でコーヒー」「スターバックスでラテ」
- デリバリー: 「デリバリー（サービス名）で注文」「Uber Eatsでピザ」
- 飲み会・宅飲み: 「居酒屋（店名）で飲み会」「◯◯と飲み会」

**交通費系:**
- 電車・バス（定期外）: 「電車（路線名）：出発駅→到着駅」「JR：渋谷→新宿」
- タクシー・代行: 「タクシー：出発地→目的地」「タクシーで帰宅」
- 定期券: 「定期券（路線名・区間）購入」「JR 渋谷〜新宿 定期券」
- 新幹線・特急: 「新幹線（路線名）：出発駅→到着駅」「のぞみ 東京→大阪」
- 飛行機: 「航空券（航空会社）：出発地→目的地」「ANA 羽田→福岡」

**通信・サブスク系:**
- 携帯電話: 「携帯料金（キャリア名）」「docomo 月額料金」
- 動画配信: 「サービス名 月額料金」「Netflix 月額」
- 音楽配信: 「サービス名 月額料金」「Spotify Premium」
- その他サブスク: 「サービス名 月額料金」「Adobe CC サブスク」

**日用品・衣料・美容系:**
- 「店舗名で商品名購入」「ユニクロでTシャツ購入」
- 「商品カテゴリー購入」「洗剤・ティッシュ購入」
- 「美容院（店名）でカット」「◯◯美容室でカラー」

**健康・医療系:**
- 「病院名で診察」「◯◯内科で診察」
- 「薬局で薬購入」「風邪薬購入」
- 「ジム（店名）月会費」「◯◯ジム 月額」

**教育・教養系:**
- 「書籍名」「プログラミング入門書」
- 「サービス名 講座」「Udemy オンライン講座」
- 「試験名 受験料」「TOEIC 受験料」

**趣味・娯楽系:**
- 「映画（作品名）鑑賞」「◯◯ 映画チケット」
- 「ゲーム（タイトル）購入」「Nintendo Switch ゲーム」
- 「ライブ（アーティスト名）チケット」「◯◯ライブ」
- 「旅行（目的地）」「温泉旅行 宿泊費」

**交際費系:**
- 「相手名と飲み会」「友人と飲み会」
- 「プレゼント（品名）」「誕生日プレゼント」
- 「相手名とデート」「映画デート」

**収入系:**
- 「アルバイト（勤務先）給与」「◯◯カフェ バイト代」
- 「お小遣い（送り主）」「親からお小遣い」
- 「副業（案件名）報酬」「◯◯案件 報酬」

**住居系:**
- 「家賃（物件名）」「月の家賃」
- 「電気代（月）」「◯月分 電気代」
- 「ガス代（月）」「◯月分 ガス代」

**一般的なルール:**
1. 店舗名や固有名詞がある場合は括弧で囲む
2. 移動系は「：」と「→」を使って経路を明確に
3. 月額サービスは「月額」「サブスク」を明記
4. 具体的な商品名や用途を含める
5. 20文字以内で簡潔に

**厳守事項:**
1. isIncomeでそれが収入(true)か支出(false)かを判定
2. **mainCategoryとsubCategoryは必ず上記のカテゴリーリストから完全一致で選択すること**
   - 例: 「食費」カテゴリーの場合、mainCategoryは必ず「食費」と入力（「飲食」「食事」などは不可）
   - 例: 「外食（ランチ）」サブカテゴリーの場合、subCategoryは必ず「外食（ランチ）」と入力（「ランチ」「外食」などは不可）
   - サブカテゴリーは括弧や記号も含めて完全一致させること
3. 収入の場合はmainCategoryを「収入」にし、subCategoryは収入カテゴリーのサブカテゴリーリストから選択
4. **descriptionは上記のテンプレートに従って構造化された形式で作成すること（必須）**
5. confidenceは0-1の数値で、確信度を表す（確実なら0.9以上、あいまいなら0.5程度）
6. 最も可能性が高い順に並べる
7. 「バイト」「給料」「お小遣い」などは収入（isIncome: true）、「購入」「支払い」などは支出（isIncome: false）と判定

**立替判定ルール:**
8. hasAdvanceは立替がある場合にtrueにする
9. advanceTypeは「友人」「友達」「割り勘」の場合は"friend"、「親」「親負担」の場合は"parent"、立替がない場合はnull
10. advanceRatioは立替金額の割合（0-1の数値）。「半分」なら0.5、「3割」なら0.3、「全額」なら1.0
11. 「友達と飲み会」「親とランチ」などは立替の可能性が高い
12. 「割り勘」「立て替え」などのキーワードがあれば確実に立替あり

**具体的な変換例:**
- 入力: "オオゼキで買い物" → description: "スーパー（オオゼキ）で食材購入"
- 入力: "セブンでお茶" → description: "コンビニ（セブンイレブン）で購入"
- 入力: "渋谷から新宿" → description: "電車：渋谷→新宿"
- 入力: "スタバでコーヒー" → description: "カフェ（スターバックス）でコーヒー"
- 入力: "Netflix" → description: "Netflix 月額料金"
- 入力: "ユニクロ" → description: "ユニクロでTシャツ購入"
- 入力: "バイト代" → description: "アルバイト給与"
- 入力: "映画見た" → description: "映画鑑賞"
- 入力: "友達とランチ" → description: "友人とランチ" (hasAdvance: true を検討)

**テンプレート適用の優先順位:**
1. 入力テキストから店舗名・サービス名を特定
2. 適切なカテゴリーとサブカテゴリーを選択
3. テンプレートに当てはめて項目名を生成
4. 不明な固有名詞は「◯◯」で代用せず、入力テキストから推測`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('Invalid AI response format:', response);
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(p => p.mainCategory && p.subCategory && p.description && typeof p.isIncome === 'boolean')
      .map(p => {
        // カテゴリーの検証とフォールバック
        const categoryExists = CATEGORIES.find(
          cat => cat.main === p.mainCategory && cat.isIncome === p.isIncome
        );
        
        let mainCategory = p.mainCategory;
        let subCategory = p.subCategory;
        
        if (!categoryExists) {
          // カテゴリーが存在しない場合は「その他」にフォールバック
          console.warn(`⚠️ AIが提案したカテゴリー「${p.mainCategory}」が見つかりません。「その他」にフォールバックします。`);
          mainCategory = 'その他';
          subCategory = 'その他';
        } else {
          // サブカテゴリーの検証
          const subExists = categoryExists.subs.includes(p.subCategory);
          if (!subExists) {
            console.warn(`⚠️ AIが提案したサブカテゴリー「${p.subCategory}」が「${p.mainCategory}」に存在しません。「その他」にフォールバックします。`);
            subCategory = categoryExists.subs.includes('その他') 
              ? 'その他' 
              : categoryExists.subs[0] || 'その他';
          }
        }
        
        return {
          category: {
            main: mainCategory,
            sub: subCategory,
          },
          description: p.description,
          isIncome: p.isIncome,
          confidence: p.confidence || 0.5,
          hasAdvance: p.hasAdvance || false,
          advanceType: p.advanceType || null,
          advanceAmount: p.advanceRatio || 0,
        };
      })
      .slice(0, 5); // 最大5パターン

  } catch (error) {
    console.error('Error getting multiple AI suggestions:', error);
    return [];
  }
};

/**
 * カテゴリーと項目名のAIサジェスチョンを取得（単一パターン）
 */
export const getAISuggestion = async (
  inputText: string,
  context?: SuggestionContext
): Promise<AISuggestion | null> => {
  const suggestions = await getMultipleAISuggestions(inputText, context);
  return suggestions[0] || null;
};

/**
 * カテゴリーのみのAIサジェスチョンを取得
 */
export const getCategorySuggestion = async (
  description: string,
  context?: SuggestionContext
): Promise<{ category: Category; confidence: number } | null> => {
  const suggestion = await getAISuggestion(description, context);
  
  if (!suggestion) {
    return null;
  }

  return {
    category: suggestion.category,
    confidence: suggestion.confidence,
  };
};

/**
 * 項目名のみのAIサジェスチョンを取得
 */
export const getDescriptionSuggestion = async (
  inputText: string,
  context?: SuggestionContext
): Promise<{ description: string; confidence: number } | null> => {
  const suggestion = await getAISuggestion(inputText, context);
  
  if (!suggestion) {
    return null;
  }

  return {
    description: suggestion.description,
    confidence: suggestion.confidence,
  };
};

/**
 * 確信度が低いかどうかを判定
 */
export const isLowConfidence = (confidence: number): boolean => {
  return confidence < 0.7;
};

/**
 * 確信度のレベルを取得
 */
export const getConfidenceLevel = (
  confidence: number
): 'high' | 'medium' | 'low' => {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
};

