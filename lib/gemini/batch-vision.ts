/**
 * Gemini Vision API - 一括認識
 * 取引リストの画像から複数の取引を一度に認識
 */

import { getGeminiModel } from './config';
import { createImagePart, extractJsonFromResponse } from './utils';
import {
  CATEGORY_LIST_PROMPT,
  PAYMENT_SERVICE_HINT_PROMPT,
  STORE_TO_PURPOSE_MAPPING,
  DESCRIPTION_TEMPLATE_BASIC_PROMPT,
  buildServiceHintPrompt,
} from './prompts';
import type {
  RecognizedTransaction,
  RawRecognitionData,
  OCROptions,
} from '@/types/image-recognition';

/**
 * 画像から複数の取引を一括認識
 * @param imageFile 取引リストの画像ファイル
 * @param options OCRオプション
 * @returns 認識された取引のリスト
 */
export async function recognizeBatchTransactionsFromImage(
  imageFile: File,
  options: OCROptions = {}
): Promise<RecognizedTransaction[]> {
  try {
    const model = getGeminiModel();
    
    if (!model) {
      throw new Error('Gemini APIが利用できません。APIキーを設定してください。');
    }

    // 画像パートを作成
    const imagePart = await createImagePart(imageFile);

    // プロンプトを構築
    const prompt = buildBatchRecognitionPrompt(options);

    // Gemini APIで画像を解析
    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    const text = response.text();

    // レスポンスをパース
    const transactions = parseBatchRecognitionResponse(text);

    return transactions;
  } catch (error: any) {
    console.error('一括画像認識に失敗しました:', error);
    
    // レートリミットエラーの検出
    const errorMessage = error?.message || '';
    const errorStatus = error?.status || error?.code;
    
    if (
      errorStatus === 429 ||
      errorMessage.includes('quota') ||
      errorMessage.includes('Quota exceeded') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('Rate limit') ||
      errorMessage.includes('RESOURCE_EXHAUSTED')
    ) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    
    throw new Error('画像から取引情報を認識できませんでした');
  }
}

/**
 * 一括認識用のプロンプトを構築
 */
function buildBatchRecognitionPrompt(options: OCROptions): string {
  const serviceHint = buildServiceHintPrompt(options.serviceHint);

  return `
この画像は決済アプリの取引リスト（複数の取引が表示されている画面）のスクリーンショットです。
画像から**すべての取引**を抽出し、JSON配列形式で回答してください。${serviceHint}

**【ステップ1】画像から各取引の以下を抽出:**
1. paymentService: 決済サービスの種類（olive, sony, dpayment, dcard, paypay, cash, unknown のいずれか）
2. date: 取引日時（ISO 8601形式、例: 2025-10-08T14:30:00+09:00）
3. amount: 金額（数値のみ、カンマや円記号は不要）
4. originalMerchantName: **画像に記載されている元の店舗名**（そのまま抽出、例: 「セブンイレブン渋谷店」「タリーズコーヒー」）
5. confidence: 認識の信頼度（0.0-1.0の範囲）

**【ステップ2】店舗名から用途を推測し、項目名を生成:**
${STORE_TO_PURPOSE_MAPPING}

**【ステップ3】カテゴリーを選択:**
${CATEGORY_LIST_PROMPT}

${PAYMENT_SERVICE_HINT_PROMPT}

${DESCRIPTION_TEMPLATE_BASIC_PROMPT}

回答形式（必ずこのJSON配列形式で回答してください）:
[
  {
    "paymentService": "olive",
    "date": "2025-10-08T14:30:00+09:00",
    "amount": 1500,
    "merchantName": "コンビニ（セブンイレブン）で買い物",
    "originalMerchantName": "セブンイレブン渋谷店",
    "confidence": 0.85,
    "suggestedCategory": {
      "main": "食費",
      "sub": "コンビニ"
    }
  },
  {
    "paymentService": "olive",
    "date": "2025-10-07T18:20:00+09:00",
    "amount": 3200,
    "merchantName": "スーパー（オオゼキ）で食材購入",
    "originalMerchantName": "オオゼキ",
    "confidence": 0.85,
    "suggestedCategory": {
      "main": "食費",
      "sub": "スーパー"
    }
  },
  {
    "paymentService": "olive",
    "date": "2025-10-06T12:30:00+09:00",
    "amount": 300,
    "merchantName": "ピッコマで漫画購入",
    "originalMerchantName": "ピッコマ",
    "confidence": 0.80,
    "suggestedCategory": {
      "main": "趣味",
      "sub": "その他"
    }
  }
]

重要な注意事項:
- 画像に表示されているすべての取引を抽出してください
- JSON配列のみを返してください（説明文は不要）
- **merchantNameは必ず店舗名マッピングとテンプレート原則に従って生成（「??」は使用禁止）**
- originalMerchantNameは画像に記載されている店舗名をそのまま抽出してください
- 金額は必ず数値型で返してください
- confidenceは認識の確実性を0.0-1.0で評価（画像が鮮明なら0.85以上、店舗名が明確なら0.8以上）
- 日付のフォーマットは必ずISO 8601形式にしてください
- カテゴリーは必ず上記リストから完全一致で選択してください
- 取引が1件もない場合は空配列 [] を返してください
`;
}

/**
 * 一括認識レスポンスをパース
 */
function parseBatchRecognitionResponse(responseText: string): RecognizedTransaction[] {
  try {
    // JSONブロックを抽出
    const jsonText = extractJsonFromResponse(responseText);
    
    if (!jsonText) {
      console.warn('JSON形式のレスポンスが見つかりませんでした');
      return [];
    }

    const parsedArray = JSON.parse(jsonText);

    if (!Array.isArray(parsedArray)) {
      console.warn('レスポンスが配列ではありません');
      return [];
    }

    // 各取引をRecognizedTransaction型に変換
    const transactions: RecognizedTransaction[] = parsedArray.map((item) => {
      // 日付をDateオブジェクトに変換
      const date = item.date ? new Date(item.date) : null;

      const rawData: RawRecognitionData = {
        fullText: responseText,
        rawResponse: JSON.stringify(item),
        confidence: item.confidence || 0.5,
      };

      return {
        paymentService: item.paymentService || 'unknown',
        date,
        amount: item.amount !== undefined ? item.amount : null,
        merchantName: item.merchantName || null,
        originalMerchantName: item.originalMerchantName || null,
        suggestedCategory: item.suggestedCategory,
        confidence: item.confidence || 0.5,
        rawData,
        metadata: item.metadata,
      };
    });

    return transactions;
  } catch (error) {
    console.error('レスポンスのパースに失敗しました:', error);
    console.error('レスポンステキスト:', responseText);
    return [];
  }
}

