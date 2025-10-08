/**
 * Gemini API用のプロンプトテンプレート
 */

import type { PaymentService } from "@/types/image-recognition";
import { getPaymentServiceName } from "@/lib/helpers/payment";

/**
 * カテゴリー一覧のプロンプト部分
 */
export const CATEGORY_LIST_PROMPT = `
カテゴリーの候補（main/sub）:
- 収入: アルバイト、お小遣い、投資・配当、副業、ポイント還元、立替金回収、その他
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
`;

/**
 * 決済サービスの識別ヒントプロンプト
 */
export const PAYMENT_SERVICE_HINT_PROMPT = `
決済サービスの識別ヒント:
- 「三井住友」「OLIVE」「SMBC」→ olive
- 「ソニー銀行」「Sony Bank」→ sony
- 「d払い」「dポイント」→ dpayment
- 「dカード」「DCMX」→ dcard
- 「PayPay」→ paypay
`;

/**
 * 項目名テンプレートのプロンプト部分（基本版）
 */
export const DESCRIPTION_TEMPLATE_BASIC_PROMPT = `
**項目名のテンプレートルール:**

項目名は店舗名・サービス名から用途を推測して生成してください。

**基本方針:**
- 店舗名やサービス名から一般的な用途を推測する
- 具体的な用途が推測できる場合は「??」を使わず明確に記載する
- 情報が本当に不足している場合のみ「??」を使用する

**推測例:**
- 「ピッコマ」→「ピッコマで漫画」
- 「三井のりぱーク」→「三井のりぱークで駐車」
- 「ニトリ」→「ニトリで家具・雑貨」
- 「ユニクロ」→「ユニクロで衣類」
- 「マツモトキヨシ」→「マツモトキヨシで日用品」
- 「ドトール」→「ドトールでカフェ」
- 「JR東日本」→「電車」
- 「Netflix」→「Netflix月額料金」
`;

/**
 * サービスヒントを含むプロンプトを生成
 * @param serviceHint 決済サービスのヒント
 * @returns プロンプト文字列
 */
export function buildServiceHintPrompt(
  serviceHint?: PaymentService
): string {
  if (!serviceHint || serviceHint === "unknown") {
    return "";
  }
  return `\n決済サービスのヒント: ${getPaymentServiceName(serviceHint)}`;
}

