/**
 * 月次統計カード群（Organism）
 * ダッシュボードの月次収支統計を表示
 */

import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { StatsCard, AdvanceBalanceCard } from "@/components/molecules";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PeriodType, PERIOD_OPTIONS } from "@/lib/helpers";

interface MonthlyStats {
  income: number;
  expense: number;
  balance: number;
  actualIncome?: number;
  advanceRecoveryAmount?: number;
  actualExpense?: number;
  actualBalance?: number;
}

interface AdvanceBalance {
  totalAdvanced: number;
  totalRecovered: number;
  remaining: number;
}

interface MonthlyStatsCardsProps {
  stats: MonthlyStats;
  loading?: boolean;
  expenseDetails?: { label: string; value: number }[];
  advanceBalance?: AdvanceBalance;
  period?: PeriodType;
  onPeriodChange?: (period: PeriodType) => void;
}

export function MonthlyStatsCards({
  stats,
  loading = false,
  expenseDetails,
  advanceBalance,
  period = "current_month",
  onPeriodChange,
}: MonthlyStatsCardsProps) {
  // 収入カードの詳細情報
  const incomeCardDetails =
    stats.advanceRecoveryAmount !== undefined && stats.advanceRecoveryAmount > 0
      ? [{ label: "含立替回収", value: stats.income }]
      : undefined;

  // 支出カードの詳細情報
  const expenseCardDetails =
    stats.actualExpense !== undefined && stats.actualExpense !== stats.expense
      ? [{ label: "含立替", value: stats.expense }]
      : expenseDetails;

  // 収支カードの詳細情報
  const balanceCardDetails =
    stats.actualBalance !== undefined && stats.actualBalance !== stats.balance
      ? [{ label: "含立替", value: stats.balance }]
      : undefined;

  const hasAdvance = advanceBalance && advanceBalance.totalAdvanced > 0;

  // 期間ラベルを取得
  const periodLabel =
    PERIOD_OPTIONS.find((opt) => opt.value === period)?.label || "今月";

  return (
    <div className="space-y-3 mb-4">
      {/* 期間選択ドロップダウン */}
      {onPeriodChange && (
        <div className="flex items-center gap-2 justify-end">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            表示期間:
          </span>
          <Select
            value={period}
            onValueChange={(value) => onPeriodChange(value as PeriodType)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 統計カード */}
      <div
        className={`grid gap-2 sm:gap-3 ${
          hasAdvance
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-3"
        }`}
      >
        <StatsCard
          title={`${periodLabel}の収入`}
          value={
            stats.actualIncome !== undefined ? stats.actualIncome : stats.income
          }
          icon={TrendingUp}
          colorScheme="green"
          loading={loading}
          details={incomeCardDetails}
        />
        <StatsCard
          title={`${periodLabel}の支出`}
          value={
            stats.actualExpense !== undefined
              ? stats.actualExpense
              : stats.expense
          }
          icon={TrendingDown}
          colorScheme="red"
          loading={loading}
          details={expenseCardDetails}
        />
        <StatsCard
          title={`${periodLabel}の収支`}
          value={
            stats.actualBalance !== undefined
              ? stats.actualBalance
              : stats.balance
          }
          icon={Wallet}
          colorScheme={
            (stats.actualBalance !== undefined
              ? stats.actualBalance
              : stats.balance) >= 0
              ? "blue"
              : "orange"
          }
          loading={loading}
          prefix={
            (stats.actualBalance !== undefined
              ? stats.actualBalance
              : stats.balance) >= 0
              ? "+"
              : ""
          }
          details={balanceCardDetails}
        />
        {hasAdvance && advanceBalance && (
          <AdvanceBalanceCard
            totalAdvanced={advanceBalance.totalAdvanced}
            totalRecovered={advanceBalance.totalRecovered}
            remaining={advanceBalance.remaining}
          />
        )}
      </div>
    </div>
  );
}
