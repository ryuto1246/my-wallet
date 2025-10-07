/**
 * 月次統計カード群（Organism）
 * ダッシュボードの月次収支統計を表示
 */

import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { StatsCard, AdvanceBalanceCard } from "@/components/molecules";

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
}

export function MonthlyStatsCards({
  stats,
  loading = false,
  expenseDetails,
  advanceBalance,
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

  return (
    <div
      className={`grid gap-2 sm:gap-3 md:gap-4 lg:gap-5 mb-6 sm:mb-8 ${
        hasAdvance ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-3"
      }`}
    >
      <StatsCard
        title="今月の収入"
        value={
          stats.actualIncome !== undefined ? stats.actualIncome : stats.income
        }
        icon={TrendingUp}
        colorScheme="green"
        loading={loading}
        details={incomeCardDetails}
      />
      <StatsCard
        title="今月の支出"
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
        title="収支"
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
  );
}
