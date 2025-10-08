/**
 * Gemini Vision API - 一括認識
 * 取引リストの画像から複数の取引を一度に認識
 */

import { getGeminiModel } from './config';
import { createImagePart, extractJsonFromResponse } from './utils';
import { buildServiceHintPrompt } from './prompts';
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
  } catch (error) {
    console.error('一括画像認識に失敗しました:', error);
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

各取引について以下の情報を抽出:
1. paymentService: 決済サービスの種類（olive, sony, dpayment, dcard, paypay, cash, unknown のいずれか）
2. date: 取引日時（ISO 8601形式、例: 2025-10-08T14:30:00+09:00）
3. amount: 金額（数値のみ、カンマや円記号は不要）
4. merchantName: **構造化された項目名**（後述のテンプレートに従う）
5. originalMerchantName: **画像に記載されている元の店舗名**（そのまま抽出、例: 「セブンイレブン渋谷店」「タリーズコーヒー」）
6. confidence: 認識の信頼度（0.0-1.0の範囲）
7. suggestedCategory: 推測されるカテゴリー（mainとsubを含むオブジェクト）

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

項目名（merchantName）は店舗名・サービス名から用途を推測して生成してください。

**基本方針:**
- 店舗名やサービス名から一般的な用途を推測する
- 具体的な用途が推測できる場合は「??」を使わず明確に記載する
- 情報が本当に不足している場合のみ「??」を使用する

**推測例:**
- 「ピッコマ」→「ピッコマで漫画」
- 「三井のりぱーく」→「三井のりぱーくで駐車」
- 「ニトリ」→「ニトリで家具・雑貨」
- 「ユニクロ」→「ユニクロで衣類」
- 「マツモトキヨシ」→「マツモトキヨシで日用品」
- 「ドトール」→「ドトールでカフェ」
- 「JR東日本」→「電車」
- 「Netflix」→「Netflix月額料金」
- 「スポティファイ」→「Spotify月額料金」

**カテゴリー別の形式:**

1. **食費（スーパー・コンビニ）**
   - 形式: 「店舗名で食材購入」「店舗名で買い物」
   - 例: 「オオゼキで食材購入」「セブンイレブンで買い物」

2. **食費（外食・カフェ）**
   - 形式: 「店舗名でカフェ」「店舗名でランチ」「店舗名で外食」
   - 例: 「タリーズでカフェ」「すき家でランチ」「マクドナルドで外食」

3. **交通費（電車・バス）**
   - 形式: 「電車（路線名）：出発駅 → 到着駅」または「電車」「駐車」
   - 例: 「電車（JR山手線）：渋谷 → 新宿」「電車」「三井のりぱーくで駐車」

4. **サブスク・定期支払い**
   - 形式: 「サービス名 月額料金」または「サービス名で用途」
   - 例: 「Netflix月額料金」「ピッコマで漫画」「Spotifyで音楽」

5. **日用品・生活費**
   - 形式: 「店舗名で用途」
   - 例: 「マツモトキヨシで日用品」「ニトリで家具」

6. **衣料・美容**
   - 形式: 「店舗名で用途」
   - 例: 「ユニクロで衣類」「無印良品で衣類」

**重要な注意事項:**
- 店舗名・サービス名から合理的に推測できる用途は積極的に記載する
- 画像から明確に読み取れない情報のみ「??」を使用する
- 推測が難しい場合は「店舗名」のみでも可

回答形式（必ずこのJSON配列形式で回答してください）:
[
  {
    "paymentService": "olive",
    "date": "2025-10-08T14:30:00+09:00",
    "amount": 1500,
    "merchantName": "セブンイレブンで買い物",
    "originalMerchantName": "セブンイレブン渋谷店",
    "confidence": 0.95,
    "suggestedCategory": {
      "main": "食費",
      "sub": "コンビニ"
    }
  },
  {
    "paymentService": "olive",
    "date": "2025-10-07T18:20:00+09:00",
    "amount": 3200,
    "merchantName": "オオゼキで食材購入",
    "originalMerchantName": "オオゼキ",
    "confidence": 0.92,
    "suggestedCategory": {
      "main": "食費",
      "sub": "スーパー"
    }
  },
  {
    "paymentService": "olive",
    "date": "2025-10-06T12:30:00+09:00",
    "amount": 300,
    "merchantName": "ピッコマで漫画",
    "originalMerchantName": "ピッコマ",
    "confidence": 0.90,
    "suggestedCategory": {
      "main": "趣味",
      "sub": "その他"
    }
  },
  {
    "paymentService": "dpayment",
    "date": "2025-10-05T09:15:00+09:00",
    "amount": 500,
    "merchantName": "三井のりぱーくで駐車",
    "originalMerchantName": "三井のりぱーく渋谷",
    "confidence": 0.88,
    "suggestedCategory": {
      "main": "交通費",
      "sub": "その他"
    }
  }
]

重要な注意事項:
- 画像に表示されているすべての取引を抽出してください
- JSON配列のみを返してください（説明文は不要）
- 各取引は配列の要素として独立したオブジェクトにしてください
- merchantNameは店舗名から用途を積極的に推測して生成してください
- originalMerchantNameは画像に記載されている店舗名をそのまま抽出してください
- 金額は必ず数値型で返してください
- confidenceは認識の確実性を0.0-1.0で評価してください
- 日付のフォーマットは必ずISO 8601形式にしてください
- 取引が1件もない場合は空配列 [] を返してください
- スクリーンショットで情報が切れている場合は推測せず「??」を使用してください
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

