/**
 * 決済サービス・決済方法関連のヘルパー関数
 */

import type { PaymentService } from "@/types/image-recognition";

/**
 * 決済サービス名のマッピング
 */
export const PAYMENT_SERVICE_NAMES: Record<PaymentService, string> = {
  olive: "三井住友OLIVE",
  sony: "ソニー銀行",
  dpayment: "d払い",
  dcard: "dカード",
  paypay: "PayPay",
  cash: "現金",
  unknown: "不明",
};

/**
 * 決済サービスから表示名を取得
 * @param service 決済サービス
 * @returns 表示名
 */
export const getPaymentServiceName = (service: PaymentService): string => {
  return PAYMENT_SERVICE_NAMES[service] || "不明";
};

/**
 * 決済サービスから決済方法を取得
 * @param service 決済サービス
 * @returns 決済方法（PaymentMethodValue）
 */
export const getPaymentMethodFromService = (service: string): string => {
  const methodMap: Record<string, string> = {
    olive: "olive",
    sony: "sony_bank",
    dpayment: "d_payment",
    dcard: "d_card",
    paypay: "paypay",
    cash: "cash",
    unknown: "other",
  };
  return methodMap[service] || "other";
};

/**
 * 決済方法から決済サービスを推測
 * @param paymentMethod 決済方法
 * @returns 決済サービス
 */
export const getPaymentServiceFromMethod = (
  paymentMethod: string
): PaymentService => {
  const normalizedMethod = paymentMethod.toLowerCase().replace(/\s+/g, "");

  if (normalizedMethod.includes("olive")) return "olive";
  if (normalizedMethod.includes("ソニー") || normalizedMethod.includes("sony"))
    return "sony";
  if (normalizedMethod.includes("d払い")) return "dpayment";
  if (normalizedMethod.includes("dカード")) return "dcard";
  if (normalizedMethod.includes("paypay")) return "paypay";
  if (normalizedMethod.includes("現金")) return "cash";

  return "unknown";
};

/**
 * 決済方法を正規化（表示名からPaymentMethodValueへ変換）
 * 既存のFirestoreデータとの互換性のため
 * @param paymentMethod 決済方法（表示名またはPaymentMethodValue）
 * @returns PaymentMethodValue
 */
export const normalizePaymentMethod = (paymentMethod: string): string => {
  // 既にPaymentMethodValueの場合はそのまま返す
  const validValues = ["olive", "sony_bank", "d_payment", "d_card", "paypay", "cash", "other"];
  if (validValues.includes(paymentMethod)) {
    return paymentMethod;
  }

  // 表示名からPaymentMethodValueに変換
  const normalizedMethod = paymentMethod.toLowerCase().replace(/\s+/g, "");
  
  if (normalizedMethod.includes("olive") || normalizedMethod.includes("三井住友")) return "olive";
  if (normalizedMethod.includes("ソニー") || normalizedMethod.includes("sony")) return "sony_bank";
  if (normalizedMethod.includes("d払い")) return "d_payment";
  if (normalizedMethod.includes("dカード")) return "d_card";
  if (normalizedMethod.includes("paypay")) return "paypay";
  if (normalizedMethod.includes("現金") || normalizedMethod.includes("cash")) return "cash";

  return "other";
};

