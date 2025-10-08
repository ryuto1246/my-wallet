/**
 * Gemini Vision API統合
 * 画像からテキストを認識して取引情報を抽出
 */

import { getGeminiModel } from './config';
import type {
  RecognizedTransaction,
  RawRecognitionData,
  PaymentService,
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

    // 画像をBase64に変換
    const imageBase64 = await fileToBase64(imageFile);
    const imagePart = {
      inlineData: {
        data: imageBase64.split(',')[1], // data:image/...の部分を除く
        mimeType: imageFile.type,
      },
    };

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
 * ファイルをBase64に変換
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 認識用のプロンプトを構築
 */
function buildRecognitionPrompt(options: OCROptions): string {
  const serviceHint = options.serviceHint
    ? `\n決済サービスのヒント: ${getServiceName(options.serviceHint)}`
    : '';

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

決済サービスの識別ヒント:
- 「三井住友」「OLIVE」「SMBC」→ olive
- 「ソニー銀行」「Sony Bank」→ sony
- 「d払い」「dポイント」→ dpayment
- 「dカード」「DCMX」→ dcard
- 「PayPay」→ paypay

カテゴリーの候補（main/sub）:
- 収入: アルバイト、お小遣い、投資・配当、副業、ポイント還元、その他
- 食費: スーパー、コンビニ、外食（ランチ）、外食（ディナー）、カフェ、デリバリー、その他
- 日用品・生活費: 日用品、消耗品、その他
- 交通費: 電車（定期内）、電車（定期外）、バス、タクシー、その他
- 教育: 教科書、文房具、書籍、ソフトウェア、資格・セミナー、その他
- 趣味: 映画・動画、ゲーム、音楽、旅行、その他
- 衣料・美容: 衣類、靴・バッグ、美容院、化粧品、その他
- 健康・医療: 病院、薬局、サプリメント、その他
- 通信・サブスク: 携帯電話、インターネット、サブスク（動画）、サブスク（音楽）、その他
- 住居: 家賃、水道光熱費、その他
- 交際費: 飲み会、プレゼント、デート、その他
- 仕事関連: 業務用品、交通費、会議費、その他
- その他: 手数料、立替、その他

**項目名のテンプレートルール（必ず守ること）:**

項目名（merchantName）は以下の形式に従ってください。情報が不完全な場合は「??」で埋めてください。

1. **食費（スーパー・コンビニ）**
   - 形式: 「??（店舗名）で食材購入」または「??（店舗名）で買い物」
   - 例: 「??（オオゼキ）で食材購入」「??（セブンイレブン）で買い物」

2. **食費（外食）**
   - 形式: 「店舗名で??」または「??（店舗名）」
   - 例: 「タリーズで??」「??（すき家）」「マクドナルドでランチ」

3. **交通費（電車・バス）**
   - 形式: 「電車（路線名）：出発駅 → 到着駅」または「電車（??）：駅名 → ??」
   - 例: 「電車（JR山手線）：渋谷 → 新宿」「電車（??）：渋谷 → ??」
   - バスの場合: 「バス：乗車地 → 降車地」または「バス（??）」

4. **サブスク・定期支払い**
   - 形式: 「サービス名 月額料金」または「サービス名（??円）」
   - 例: 「Netflix 月額料金」「Spotify（??円）」

5. **その他の支払い**
   - 形式: 「店舗名・サービス名（用途）」または「??（店舗名）」
   - 例: 「ユニクロ（衣類購入）」「??（ドラッグストア）」

**重要な注意事項:**
- スクリーンショットに情報が不足している場合は、無理に推測せず「??」を使用してください
- 店舗名が部分的にしか見えない場合: 「??（見えている部分）」
- 駅名や路線が不明な場合: 「電車（??）：渋谷 → ??」
- 金額が不明な場合: 「サービス名（??円）」
- カテゴリーに応じた適切なテンプレートを選択してください

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
    // JSONブロックを抽出（マークダウン形式の場合に対応）
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
                      responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('JSON形式のレスポンスが見つかりませんでした');
    }

    const jsonText = jsonMatch[1] || jsonMatch[0];
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
 * 決済サービス名を取得
 */
function getServiceName(service: PaymentService): string {
  const serviceNames: Record<PaymentService, string> = {
    olive: '三井住友OLIVE',
    sony: 'ソニー銀行',
    dpayment: 'd払い',
    dcard: 'dカード',
    paypay: 'PayPay',
    cash: '現金',
    unknown: '不明',
  };
  return serviceNames[service] || '不明';
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

    // 画像をBase64に変換
    const imageBase64 = await fileToBase64(imageFile);
    const imagePart = {
      inlineData: {
        data: imageBase64.split(',')[1],
        mimeType: imageFile.type,
      },
    };

    const prompt = 'この画像に含まれるすべてのテキストを抽出してください。';

    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('テキスト抽出に失敗しました:', error);
    throw new Error('テキストを抽出できませんでした');
  }
}

