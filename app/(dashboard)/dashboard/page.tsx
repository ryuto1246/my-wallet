/**
 * ダッシュボードページ
 */

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useTransactions, useAdvance } from "@/hooks";
import { DashboardTemplate } from "@/components/templates";
import {
  PageHeader,
  MonthlyStatsCards,
  TransactionList,
  TransactionForm,
  BatchImageRecognitionDialog,
} from "@/components/organisms";
import { TransactionFormValues } from "@/lib/validations/transaction";
import {
  calculateMonthlyStats,
  getRecentTransactions,
  transformFormDataToTransaction,
} from "@/lib/helpers";
import { calculateActualExpense } from "@/lib/helpers/advance";
import type { TransactionInput } from "@/types/transaction";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { transactions, loading, createTransaction } = useTransactions();
  const { balance } = useAdvance();
  const [formOpen, setFormOpen] = useState(false);
  const [batchImageDialogOpen, setBatchImageDialogOpen] = useState(false);

  // 今月の収支を計算（全体と立替除外の両方）
  const monthlyStats = useMemo(() => {
    const stats = calculateMonthlyStats(transactions);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyTransactions = transactions.filter((t) => {
      const txDate = new Date(t.date);
      return (
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear
      );
    });

    // 立替金回収の金額を計算
    const advanceRecoveryAmount = monthlyTransactions
      .filter((t) => t.isIncome && t.category.sub === "立替金回収")
      .reduce((sum, t) => sum + t.amount, 0);

    // 実収入（立替金回収を除く）
    const actualIncome = stats.income - advanceRecoveryAmount;

    // 立替除外の実際の支出額を計算
    const actualExpense = calculateActualExpense(
      monthlyTransactions.filter((t) => !t.isIncome)
    );

    // 実収支（立替金回収と立替を除外）
    const actualBalance = actualIncome - actualExpense;

    return {
      ...stats,
      actualIncome, // 立替金回収を除く実収入
      advanceRecoveryAmount, // 立替金回収額
      actualExpense, // 立替除外の支出額
      actualBalance, // 実収支
    };
  }, [transactions]);

  // 支出の内訳を計算（立替金額と自己負担額）
  const expenseDetails = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyTransactions = transactions.filter((t) => {
      const txDate = new Date(t.date);
      return (
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear &&
        !t.isIncome
      );
    });

    let advanceAmount = 0;
    let personalAmount = 0;

    monthlyTransactions.forEach((t) => {
      if (t.advance) {
        advanceAmount += t.advance.advanceAmount;
        personalAmount += t.advance.personalAmount;
      } else {
        personalAmount += t.amount;
      }
    });

    if (advanceAmount > 0 || personalAmount > 0) {
      return [
        { label: "立替金額", value: advanceAmount },
        { label: "自己負担", value: personalAmount },
      ];
    }

    return undefined;
  }, [transactions]);

  // 最近の取引（画面に収まる分だけ表示：3件）
  const recentTransactions = useMemo(
    () => getRecentTransactions(transactions, 3),
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

  // 一括登録
  const handleBatchSubmit = async (transactionsData: TransactionInput[]) => {
    try {
      // 各トランザクションを順次登録
      for (const data of transactionsData) {
        // TransactionInputをTransactionFormDataに変換
        const formData: TransactionFormValues = {
          date: data.date,
          amount: data.amount,
          categoryMain: data.category.main,
          categorySub: data.category.sub,
          description: data.description,
          paymentMethod: data.paymentMethod,
          isIncome: data.isIncome,
          hasAdvance: !!data.advance,
          advance: data.advance
            ? {
                type: data.advance.type || null,
                totalAmount: data.advance.totalAmount || data.amount,
                advanceAmount: data.advance.advanceAmount || 0,
                personalAmount: data.advance.personalAmount || data.amount,
                memo: data.advance.memo || "",
              }
            : undefined,
          memo: data.memo || "",
        };
        const transactionData = transformFormDataToTransaction(formData);
        await createTransaction(transactionData);
      }
    } catch (error) {
      console.error("一括登録エラー:", error);
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
        showImageButton
        onImageClick={() => setBatchImageDialogOpen(true)}
      />

      {/* 月次統計カード */}
      <MonthlyStatsCards
        stats={monthlyStats}
        loading={loading}
        expenseDetails={expenseDetails}
        advanceBalance={balance}
      />

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

      <BatchImageRecognitionDialog
        open={batchImageDialogOpen}
        onOpenChange={setBatchImageDialogOpen}
        onBatchSubmit={handleBatchSubmit}
      />
    </DashboardTemplate>
  );
}
