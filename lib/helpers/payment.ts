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
 * @returns 決済方法
 */
export const getPaymentMethodFromService = (service: string): string => {
  const methodMap: Record<string, string> = {
    olive: "三井住友 OLIVE",
    sony: "ソニー銀行",
    dpayment: "d払い",
    dcard: "dカード",
    paypay: "PayPay",
    cash: "現金",
  };
  return methodMap[service] || "その他";
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

