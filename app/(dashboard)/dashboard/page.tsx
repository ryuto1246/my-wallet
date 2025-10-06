/**
 * ダッシュボードページ
 */

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useTransactions } from "@/hooks";
import { DashboardTemplate } from "@/components/templates";
import {
  PageHeader,
  MonthlyStatsCards,
  TransactionList,
  TransactionForm,
} from "@/components/organisms";
import { TransactionFormValues } from "@/lib/validations/transaction";
import {
  calculateMonthlyStats,
  getRecentTransactions,
  transformFormDataToTransaction,
} from "@/lib/helpers";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { transactions, loading, createTransaction } = useTransactions();
  const [formOpen, setFormOpen] = useState(false);

  // 今月の収支を計算
  const monthlyStats = useMemo(
    () => calculateMonthlyStats(transactions),
    [transactions]
  );

  // 最近の取引（最新5件）
  const recentTransactions = useMemo(
    () => getRecentTransactions(transactions, 5),
    [transactions]
  );

  const handleSubmit = async (data: TransactionFormValues) => {
    try {
      const transactionData = transformFormDataToTransaction(data);
      await createTransaction(transactionData);
    } catch (error) {
      console.error("トランザクション作成エラー:", error);
      throw error;
    }
  };

  return (
    <DashboardTemplate>
      <PageHeader
        title="ダッシュボード"
        userName={user?.displayName}
        showAddButton
        onAddClick={() => setFormOpen(true)}
      />

      <MonthlyStatsCards stats={monthlyStats} loading={loading} />

      <TransactionList
        title="最近の取引"
        transactions={recentTransactions}
        loading={loading}
        onAddClick={() => setFormOpen(true)}
        onViewAllClick={() => router.push("/transactions")}
      />

      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        mode="create"
      />
    </DashboardTemplate>
  );
}
