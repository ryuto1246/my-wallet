/**
 * 決済サービス・決済方法関連のヘルパー関数
 */

import type { PaymentService } from "@/types/image-recognition";

/**
 * 決済サービス名のマッピング
 */
export const PAYMENT_SERVICE_NAMES: Record<PaymentService, string> = {
  olive: "三井住友OLIVE",
  smbc_bank: "三井住友銀行",
  sony: "ソニー銀行",
  dpayment: "d払い",
  dcard: "dカード",
  paypay: "PayPay",
  v_point_pay: "V-Point Pay",
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
    smbc_bank: "smbc_bank",
    sony: "sony_bank",
    dpayment: "d_payment",
    dcard: "d_card",
    paypay: "paypay",
    v_point_pay: "v_point_pay",
    cash: "cash",
    unknown: "other",
  };
  return methodMap[service] || "other";
};

/**
 * 決済方法から決済サービスを推測
 * @param paymentMethod 決済方法（PaymentMethodValueまたは表示名）
 * @returns 決済サービス
 */
export const getPaymentServiceFromMethod = (
  paymentMethod: string
): PaymentService => {
  const normalizedMethod = paymentMethod.toLowerCase().replace(/\s+/g, "");

  // PaymentMethodValueから直接判定
  if (normalizedMethod === "olive") return "olive";
  if (normalizedMethod === "smbc_bank") return "smbc_bank";
  if (normalizedMethod === "sony_bank") return "sony";
  if (normalizedMethod === "d_payment") return "dpayment";
  if (normalizedMethod === "d_card") return "dcard";
  if (normalizedMethod === "paypay") return "paypay";
  if (normalizedMethod === "v_point_pay") return "v_point_pay";
  if (normalizedMethod === "cash") return "cash";

  // 表示名や部分一致で判定（後方互換性のため）
  // 三井住友銀行と三井住友OLIVEを区別（銀行を先に判定）
  if (normalizedMethod.includes("三井住友銀行") || normalizedMethod.includes("smbc_bank"))
    return "smbc_bank";
  if (normalizedMethod.includes("olive") || normalizedMethod.includes("三井住友カード"))
    return "olive";
  if (normalizedMethod.includes("ソニー") || normalizedMethod.includes("sony"))
    return "sony";
  if (normalizedMethod.includes("d払い")) return "dpayment";
  if (normalizedMethod.includes("dカード")) return "dcard";
  if (normalizedMethod.includes("paypay")) return "paypay";
  if (normalizedMethod.includes("v-pointpay") || normalizedMethod.includes("vpointpay") || normalizedMethod.includes("v_point_pay")) return "v_point_pay";
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
  const validValues = ["olive", "smbc_bank", "sony_bank", "d_payment", "d_card", "paypay", "v_point_pay", "cash", "other"];
  if (validValues.includes(paymentMethod)) {
    return paymentMethod;
  }

  // 表示名からPaymentMethodValueに変換
  const normalizedMethod = paymentMethod.toLowerCase().replace(/\s+/g, "");
  
  // 三井住友銀行と三井住友カード/OLIVEを区別
  if (normalizedMethod.includes("三井住友銀行") || normalizedMethod.includes("smbc")) return "smbc_bank";
  if (normalizedMethod.includes("olive") || normalizedMethod.includes("三井住友カード") || normalizedMethod.includes("三井住友olive")) return "olive";
  if (normalizedMethod.includes("ソニー") || normalizedMethod.includes("sony")) return "sony_bank";
  if (normalizedMethod.includes("d払い")) return "d_payment";
  if (normalizedMethod.includes("dカード")) return "d_card";
  if (normalizedMethod.includes("paypay")) return "paypay";
  if (normalizedMethod.includes("v-pointpay") || normalizedMethod.includes("vpointpay") || normalizedMethod.includes("v_point_pay") || normalizedMethod.includes("v-point")) return "v_point_pay";
  if (normalizedMethod.includes("現金") || normalizedMethod.includes("cash")) return "cash";

  return "other";
};

