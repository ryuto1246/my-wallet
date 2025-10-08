/**
 * 残高推移グラフ用のヘルパー関数
 */

import { Transaction } from '@/types/transaction';
import { BalanceAdjustment } from '@/types/balance-adjustment';
import { PAYMENT_METHODS } from '@/constants/paymentMethods';
import { isTransferTransaction } from './transaction';
import { startOfDay, endOfDay, eachDayOfInterval, eachMonthOfInterval, format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ja } from 'date-fns/locale';

export type ChartPeriodType = 'month' | 'year';

export interface BalanceChartDataPoint {
  date: string; // 表示用の日付文字列
  dateKey: string; // ソート・比較用の日付キー
  totalAssets: number; // 総資産（折れ線グラフ用）
  // 各決済手段の残高（プラスとマイナスを分離）
  // 例: olive_positive, olive_negative
  [paymentMethod: string]: number | string;
}

/**
 * 指定期間の残高推移データを計算
 */
export function calculateBalanceChartData(
  transactions: Transaction[],
  adjustments: BalanceAdjustment[],
  periodType: ChartPeriodType
): BalanceChartDataPoint[] {
  const now = new Date();
  let intervals: Date[];
  let formatPattern: string;

  if (periodType === 'month') {
    // 直近1ヶ月を日別に
    const startDate = startOfDay(subDays(now, 30));
    const endDate = endOfDay(now);
    intervals = eachDayOfInterval({ start: startDate, end: endDate });
    formatPattern = 'M/d';
  } else {
    // 直近1年を月別に
    const startDate = startOfMonth(subMonths(now, 11));
    const endDate = endOfMonth(now);
    intervals = eachMonthOfInterval({ start: startDate, end: endDate });
    formatPattern = 'yyyy/M';
  }

  // 各期間ごとの残高を計算
  const chartData: BalanceChartDataPoint[] = intervals.map((date) => {
    const balances = calculateBalancesAtDate(
      transactions,
      adjustments,
      periodType === 'month' ? endOfDay(date) : endOfMonth(date)
    );

    const dataPoint: BalanceChartDataPoint = {
      date: format(date, formatPattern, { locale: ja }),
      dateKey: format(date, 'yyyy-MM-dd'),
      totalAssets: 0,
    };

    // 各決済手段の残高を正負に分けて設定
    let totalAssets = 0;
    PAYMENT_METHODS.forEach(({ value }) => {
      const balance = balances[value] || 0;
      
      // 正の値と負の値を分離
      if (balance >= 0) {
        dataPoint[`${value}_positive`] = balance;
        dataPoint[`${value}_negative`] = 0;
      } else {
        dataPoint[`${value}_positive`] = 0;
        dataPoint[`${value}_negative`] = balance;
      }
      
      totalAssets += balance;
    });

    dataPoint.totalAssets = totalAssets;

    return dataPoint;
  });

  return chartData;
}

/**
 * 特定日時点での各決済手段の残高を計算（立替除外）
 */
function calculateBalancesAtDate(
  transactions: Transaction[],
  adjustments: BalanceAdjustment[],
  targetDate: Date
): Record<string, number> {
  const balances: Record<string, number> = {};

  // 各決済手段の最新調整を取得（対象日時点まで）
  const latestAdjustmentMap = new Map<string, BalanceAdjustment>();
  adjustments
    .filter((adj) => new Date(adj.date) <= targetDate)
    .forEach((adj) => {
      const existing = latestAdjustmentMap.get(adj.paymentMethod);
      if (!existing || new Date(adj.date) > new Date(existing.date)) {
        latestAdjustmentMap.set(adj.paymentMethod, adj);
      }
    });

  // 各決済手段の残高を計算
  PAYMENT_METHODS.forEach(({ value: method }) => {
    const latestAdjustment = latestAdjustmentMap.get(method);

    if (latestAdjustment) {
      // 調整基準日から対象日までの収支を計算
      const transactionsInRange = transactions.filter((t) => {
        const txDate = new Date(t.date);
        const isInRange =
          txDate > new Date(latestAdjustment.date) && txDate <= targetDate;
        const isRelatedToMethod =
          t.paymentMethod === method ||
          (t.transfer &&
            (t.transfer.from === method || t.transfer.to === method));
        return isRelatedToMethod && isInRange;
      });

      let income = 0;
      let expense = 0;

      transactionsInRange.forEach((t) => {
        if (isTransferTransaction(t) && t.transfer) {
          // 振替の場合
          if (t.transfer.from === method) {
            expense += t.amount;
          } else if (t.transfer.to === method) {
            income += t.amount;
          }
        } else {
          // 通常の取引（立替金回収は含む）
          if (t.isIncome) {
            income += t.amount;
          } else {
            // 支出の場合、立替分は除外
            const actualAmount = t.advance
              ? t.advance.personalAmount
              : t.amount;
            expense += actualAmount;
          }
        }
      });

      balances[method] = latestAdjustment.actualBalance + income - expense;
    } else {
      // 調整がない場合は全期間の収支（対象日まで）
      const transactionsInRange = transactions.filter((t) => {
        const txDate = new Date(t.date);
        const isInRange = txDate <= targetDate;
        const isRelatedToMethod =
          t.paymentMethod === method ||
          (t.transfer &&
            (t.transfer.from === method || t.transfer.to === method));
        return isRelatedToMethod && isInRange;
      });

      let income = 0;
      let expense = 0;

      transactionsInRange.forEach((t) => {
        if (isTransferTransaction(t) && t.transfer) {
          // 振替の場合
          if (t.transfer.from === method) {
            expense += t.amount;
          } else if (t.transfer.to === method) {
            income += t.amount;
          }
        } else {
          // 通常の取引（立替金回収は含む）
          if (t.isIncome) {
            income += t.amount;
          } else {
            // 支出の場合、立替分は除外
            const actualAmount = t.advance
              ? t.advance.personalAmount
              : t.amount;
            expense += actualAmount;
          }
        }
      });

      balances[method] = income - expense;
    }
  });

  return balances;
}

/**
 * グラフ用の決済手段リストを取得（表示順）
 */
export function getPaymentMethodsForChart() {
  return PAYMENT_METHODS.map(({ value, label, color }) => ({
    key: value,
    label,
    color: color || '#6B7280',
  }));
}

