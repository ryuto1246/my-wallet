/**
 * AI サジェスチョン機能
 */

import { getGeminiModel } from './config';
import { Category } from '@/types/category';
import { CATEGORIES } from '@/constants/categories';
import { STORE_TO_PURPOSE_MAPPING, DESCRIPTION_TEMPLATE_BASIC_PROMPT } from './prompts';

import type { PaymentMethodValue } from '@/types/transaction';

export interface SuggestionContext {
  amount?: number;
  paymentMethod?: PaymentMethodValue;
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

    const prompt = `あなたは家計簿アプリのAIアシスタントです。ユーザーの入力から、適切なカテゴリーと具体的な項目名を1〜5パターン提案してください（最も可能性が高いものから順に、目安は3パターン）。

入力テキスト: "${inputText}"
${contextInfo}

**【ステップ1】店舗名・サービス名を特定**
入力テキストから店舗名やサービス名を抽出し、以下のマッピングを参照して用途を推測してください：

${STORE_TO_PURPOSE_MAPPING}

**【ステップ2】カテゴリーを選択（以下から完全一致で選択）**
${categoryList}

**カテゴリー選択の優先順位:**
1. 店舗名・サービス名から推測（上記マッピング参照）
2. 金額・時間帯から推測
3. 「その他」は最後の手段（明確に分類できない場合のみ）

**【ステップ3】項目名を生成**
${DESCRIPTION_TEMPLATE_BASIC_PROMPT}

**重要: 絶対に「??（店名）」のような曖昧な表現を使わないでください**

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

**厳守事項:**
1. isIncomeでそれが収入(true)か支出(false)かを判定
2. **mainCategoryとsubCategoryは必ず上記のカテゴリーリストから完全一致で選択すること**
   - 例: 「食費」カテゴリーの場合、mainCategoryは必ず「食費」と入力（「飲食」「食事」などは不可）
   - 例: 「外食（ランチ）」サブカテゴリーの場合、subCategoryは必ず「外食（ランチ）」と入力（「ランチ」「外食」などは不可）
   - サブカテゴリーは括弧や記号も含めて完全一致させること
3. 収入の場合はmainCategoryを「収入」にし、subCategoryは収入カテゴリーのサブカテゴリーリストから選択
4. **descriptionは必ず店舗名マッピングとテンプレート原則に従って生成すること（「??」は使用禁止）**
5. confidenceは0-1の数値（確実なら0.85以上、店舗名が明確なら0.8以上、推測が必要なら0.6程度）
6. 提案は確信度が高い順に並べる
7. 「バイト」「給料」「お小遣い」は収入（isIncome: true）、「購入」「支払い」は支出（isIncome: false）

**立替判定ルール:**
8. hasAdvanceは立替がある場合にtrueにする
9. advanceTypeは「友人」「友達」「割り勘」の場合は"friend"、「親」「親負担」の場合は"parent"、立替がない場合はnull
10. advanceRatioは立替金額の割合（0-1の数値）。「半分」なら0.5、「3割」なら0.3、「全額」なら1.0
11. 「友達と飲み会」「親とランチ」などは立替の可能性が高い
12. 「割り勘」「立て替え」などのキーワードがあれば確実に立替あり

**変換例（重要）:**
- "ニューデイズ" → description: "コンビニ（ニューデイズ）で買い物", category: 食費/コンビニ
- "オオゼキ" → description: "スーパー（オオゼキ）で食材購入", category: 食費/スーパー
- "スタバ" → description: "カフェ（スターバックス）でコーヒー", category: 食費/カフェ
- "Netflix" → description: "Netflix 月額料金", category: 通信・サブスク/サブスク（動画）
- "JR" → description: "電車移動", category: 交通費/電車（定期外）`;

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

