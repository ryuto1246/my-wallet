/**
 * Helpers エクスポート
 */

export * from "./transaction";
export * from "./format";
export * from "./date";
export * from "./advance";
export * from "./balance-chart";
export * from "./duplicate-detection";
export * from "./time";
export * from "./payment";
export * from "./pdf";

/**
 * 期間タイプ定義
 */
export type PeriodType = 'current_month' | 'last_30_days' | 'current_year' | 'last_365_days';

export interface PeriodOption {
  value: PeriodType;
  label: string;
}

export const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 'current_month', label: '今月' },
  { value: 'last_30_days', label: '直近30日' },
  { value: 'current_year', label: '今年' },
  { value: 'last_365_days', label: '直近1年' },
];

