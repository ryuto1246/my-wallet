/**
 * フォーマット関連のヘルパー関数
 */

import { format } from "date-fns";
import { ja } from "date-fns/locale";

/**
 * 金額をフォーマット（日本円）
 */
export function formatCurrency(amount: number, prefix: string = "¥"): string {
  return `${prefix}${amount.toLocaleString("ja-JP")}`;
}

/**
 * 日付をフォーマット
 */
export function formatDate(
  date: Date | string | number,
  pattern: string = "yyyy年M月d日(E)"
): string {
  const dateObj = typeof date === "object" ? date : new Date(date);
  return format(dateObj, pattern, { locale: ja });
}

/**
 * 相対的な日付表現を取得（今日、昨日、○日前など）
 */
export function getRelativeDateLabel(date: Date | string | number): string {
  const dateObj = typeof date === "object" ? date : new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate()
  );

  const diffTime = today.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "今日";
  if (diffDays === 1) return "昨日";
  if (diffDays === 2) return "一昨日";
  if (diffDays > 0 && diffDays <= 7) return `${diffDays}日前`;

  return formatDate(dateObj, "M月d日(E)");
}

/**
 * パーセンテージをフォーマット
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * 数値を省略形式でフォーマット（1000 → 1K、1000000 → 1M）
 */
export function formatNumberCompact(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

