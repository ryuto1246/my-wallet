/**
 * Gemini Vision API統合
 * 画像からテキストを認識して取引情報を抽出
 */

import { getGeminiModel } from './config';
import { createImagePart, extractJsonFromResponse } from './utils';
import {
  CATEGORY_LIST_PROMPT,
  PAYMENT_SERVICE_HINT_PROMPT,
  DESCRIPTION_TEMPLATE_BASIC_PROMPT,
  buildServiceHintPrompt,
} from './prompts';
import type {
  RecognizedTransaction,
  RawRecognitionData,
  OCROptions,
} from '@/types/image-recognition';

/**
 * 画像から取引情報を認識
 * @param imageFile 画像ファイル
 * @param options OCRオプション
 * @returns 認識された取引情報
 */
export async function recognizeTransactionFromImage(
  imageFile: File,
  options: OCROptions = {}
): Promise<RecognizedTransaction> {
  try {
    const model = getGeminiModel();
    
    if (!model) {
      throw new Error('Gemini APIが利用できません。APIキーを設定してください。');
    }

    // 画像パートを作成
    const imagePart = await createImagePart(imageFile);

    // プロンプトを構築
    const prompt = buildRecognitionPrompt(options);

    // Gemini APIで画像を解析
    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    const text = response.text();

    // レスポンスをパース
    const parsedData = parseRecognitionResponse(text);

    // 生データを保存
    const rawData: RawRecognitionData = {
      fullText: text,
      rawResponse: JSON.stringify(response),
      confidence: parsedData.confidence || 0.5,
    };

    // 認識結果を返す
    const recognizedTransaction: RecognizedTransaction = {
      paymentService: parsedData.paymentService || 'unknown',
      date: parsedData.date || null,
      amount: parsedData.amount || null,
      merchantName: parsedData.merchantName || null,
      suggestedCategory: parsedData.suggestedCategory,
      confidence: parsedData.confidence || 0.5,
      rawData,
      metadata: parsedData.metadata,
    };

    return recognizedTransaction;
  } catch (error) {
    console.error('画像認識に失敗しました:', error);
    throw new Error('画像から取引情報を認識できませんでした');
  }
}

/**
 * 認識用のプロンプトを構築
 */
function buildRecognitionPrompt(options: OCROptions): string {
  const serviceHint = buildServiceHintPrompt(options.serviceHint);

  return `
この画像は決済アプリ（スマホ決済・銀行アプリなど）のスクリーンショットです。
画像から以下の情報を抽出し、JSON形式で回答してください。${serviceHint}

抽出する情報:
1. paymentService: 決済サービスの種類（olive, sony, dpayment, dcard, paypay, cash, unknown のいずれか）
2. date: 取引日時（ISO 8601形式、例: 2025-10-08T14:30:00+09:00）
3. amount: 金額（数値のみ、カンマや円記号は不要）
4. merchantName: **構造化された項目名**（後述のテンプレートに従う）
5. confidence: 認識の信頼度（0.0-1.0の範囲）
6. suggestedCategory: 推測されるカテゴリー（mainとsubを含むオブジェクト）
7. metadata: 追加情報（paymentMethod, location, transactionIdなど）

${PAYMENT_SERVICE_HINT_PROMPT}

${CATEGORY_LIST_PROMPT}

${DESCRIPTION_TEMPLATE_BASIC_PROMPT}

回答形式（必ずこのJSON形式で回答してください）:
{
  "paymentService": "olive",
  "date": "2025-10-08T14:30:00+09:00",
  "amount": 1500,
  "merchantName": "??（セブンイレブン）で買い物",
  "confidence": 0.95,
  "suggestedCategory": {
    "main": "食費",
    "sub": "コンビニ"
  },
  "metadata": {
    "paymentMethod": "クレジットカード",
    "location": "東京都渋谷区"
  }
}

注意事項:
- JSONのみを返してください（説明文は不要）
- 情報が不明な場合は「??」を使用してください（nullではなく）
- merchantNameは必ずテンプレートに従った形式で生成してください
- 金額は必ず数値型で返してください
- confidenceは認識の確実性を0.0-1.0で評価してください
- 日付のフォーマットは必ずISO 8601形式にしてください
- スクリーンショットで情報が切れている場合は推測せず「??」を使用してください
`;
}

/**
 * 認識レスポンスをパース
 */
function parseRecognitionResponse(responseText: string): Partial<RecognizedTransaction> {
  try {
    // JSONブロックを抽出
    const jsonText = extractJsonFromResponse(responseText);
    
    if (!jsonText) {
      throw new Error('JSON形式のレスポンスが見つかりませんでした');
    }

    const parsed = JSON.parse(jsonText);

    // 日付をDateオブジェクトに変換
    if (parsed.date) {
      parsed.date = new Date(parsed.date);
    }

    return parsed;
  } catch (error) {
    console.error('レスポンスのパースに失敗しました:', error);
    console.error('レスポンステキスト:', responseText);
    
    // パースに失敗した場合は基本的な情報のみ返す
    return {
      paymentService: 'unknown',
      confidence: 0.3,
      date: null,
      amount: null,
      merchantName: null,
    };
  }
}

/**
 * 複数の画像を一括認識
 * @param imageFiles 画像ファイルの配列
 * @param options OCRオプション
 * @returns 認識結果の配列
 */
export async function recognizeMultipleImages(
  imageFiles: File[],
  options: OCROptions = {}
): Promise<RecognizedTransaction[]> {
  const recognitionPromises = imageFiles.map((file) =>
    recognizeTransactionFromImage(file, options)
  );

  try {
    return await Promise.all(recognitionPromises);
  } catch (error) {
    console.error('一括認識に失敗しました:', error);
    throw new Error('一括認識に失敗しました');
  }
}

/**
 * 画像から生テキストを抽出（デバッグ用）
 * @param imageFile 画像ファイル
 * @returns 抽出されたテキスト
 */
export async function extractTextFromImage(imageFile: File): Promise<string> {
  try {
    const model = getGeminiModel();
    
    if (!model) {
      throw new Error('Gemini APIが利用できません。');
    }

    // 画像パートを作成
    const imagePart = await createImagePart(imageFile);

    const prompt = 'この画像に含まれるすべてのテキストを抽出してください。';

    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('テキスト抽出に失敗しました:', error);
    throw new Error('テキストを抽出できませんでした');
  }
}

