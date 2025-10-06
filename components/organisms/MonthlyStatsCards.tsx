/**
 * 月次統計カード群（Organism）
 * ダッシュボードの月次収支統計を表示
 */

import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { StatsCard } from "@/components/molecules";

interface MonthlyStats {
  income: number;
  expense: number;
  balance: number;
}

interface MonthlyStatsCardsProps {
  stats: MonthlyStats;
  loading?: boolean;
}

export function MonthlyStatsCards({
  stats,
  loading = false,
}: MonthlyStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatsCard
        title="今月の収入"
        value={stats.income}
        icon={TrendingUp}
        colorScheme="green"
        loading={loading}
      />
      <StatsCard
        title="今月の支出"
        value={stats.expense}
        icon={TrendingDown}
        colorScheme="red"
        loading={loading}
      />
      <StatsCard
        title="収支"
        value={stats.balance}
        icon={Wallet}
        colorScheme={stats.balance >= 0 ? "blue" : "orange"}
        loading={loading}
        prefix={stats.balance >= 0 ? "+" : ""}
      />
    </div>
  );
}
