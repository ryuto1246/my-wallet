/**
 * ダッシュボードページ
 */

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useAuth,
  useTransactions,
  useAdvance,
  useBalanceAdjustments,
} from "@/hooks";
import { DashboardTemplate } from "@/components/templates";
import {
  PageHeader,
  MonthlyStatsCards,
  TransactionList,
  TransactionFormNew,
  BatchImageRecognitionDialog,
  PaymentMethodBalances,
  BalanceAdjustmentDialog,
  TransferFormDialog,
} from "@/components/organisms";
import { TransactionFormValues } from "@/lib/validations/transaction";
import {
  calculatePeriodStats,
  getRecentTransactions,
  transformFormDataToTransaction,
  getCurrentMonthRange,
  getLastThirtyDaysRange,
  getCurrentYearRange,
  getLastYearRange,
  PeriodType,
  calculatePaymentMethodBalances,
  mergeTransactionsAndAdjustments,
} from "@/lib/helpers";
import { calculateActualExpense } from "@/lib/helpers/advance";
import type { TransactionInput, PaymentMethodValue } from "@/types/transaction";
import {
  createBalanceAdjustment,
  deleteBalanceAdjustment,
} from "@/lib/firebase";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { transactions, loading, createTransaction } = useTransactions();
  const { balance } = useAdvance();
  const { adjustments } = useBalanceAdjustments();
  const [formOpen, setFormOpen] = useState(false);
  const [batchImageDialogOpen, setBatchImageDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] =
    useState<PeriodType>("current_month");
  const [balanceAdjustmentOpen, setBalanceAdjustmentOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethodValue | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  // 期間に応じた日付範囲を取得
  const dateRange = useMemo(() => {
    switch (selectedPeriod) {
      case "current_month":
        return getCurrentMonthRange();
      case "last_30_days":
        return getLastThirtyDaysRange();
      case "current_year":
        return getCurrentYearRange();
      case "last_365_days":
        return getLastYearRange();
      default:
        return getCurrentMonthRange();
    }
  }, [selectedPeriod]);

  // 選択期間の収支を計算（全体と立替除外の両方）
  const periodStats = useMemo(() => {
    const stats = calculatePeriodStats(
      transactions,
      dateRange.start,
      dateRange.end
    );

    const periodTransactions = transactions.filter((t) => {
      const txDate = new Date(t.date);
      return txDate >= dateRange.start && txDate <= dateRange.end;
    });

    // 立替金回収の金額を計算
    const advanceRecoveryAmount = periodTransactions
      .filter((t) => t.isIncome && t.category.sub === "立替金回収")
      .reduce((sum, t) => sum + t.amount, 0);

    // 実収入（立替金回収を除く）
    const actualIncome = stats.income - advanceRecoveryAmount;

    // 立替除外の実際の支出額を計算
    const actualExpense = calculateActualExpense(
      periodTransactions.filter((t) => !t.isIncome)
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
  }, [transactions, dateRange]);

  // 支出の内訳を計算（立替金額と自己負担額）
  const expenseDetails = useMemo(() => {
    const periodTransactions = transactions.filter((t) => {
      const txDate = new Date(t.date);
      return (
        txDate >= dateRange.start && txDate <= dateRange.end && !t.isIncome
      );
    });

    let advanceAmount = 0;
    let personalAmount = 0;

    periodTransactions.forEach((t) => {
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
  }, [transactions, dateRange]);

  // 取引と残高調整を統合
  const allTransactions = useMemo(() => {
    console.log("🔄 Merging transactions and adjustments:", {
      transactionsCount: transactions.length,
      adjustmentsCount: adjustments.length,
    });
    const merged = mergeTransactionsAndAdjustments(transactions, adjustments);
    console.log("✅ Merged transactions:", merged.length);
    return merged;
  }, [transactions, adjustments]);

  // 最近の取引（画面に収まる分だけ表示：3件）
  const recentTransactions = useMemo(
    () => getRecentTransactions(allTransactions, 3),
    [allTransactions]
  );

  // 決済手段別の残高を計算（最終確認基準）
  const paymentMethodBalances = useMemo(() => {
    console.log("💰 Calculating payment method balances:", {
      transactionsCount: transactions.length,
      adjustmentsCount: adjustments.length,
    });
    const balances = calculatePaymentMethodBalances(transactions, adjustments);
    console.log("✅ Payment method balances:", balances);
    return balances;
  }, [transactions, adjustments]);

  // 選択された決済手段の期待残高を取得
  const selectedPaymentMethodBalance = useMemo(() => {
    if (!selectedPaymentMethod) return 0;
    const balance = paymentMethodBalances.find(
      (b) => b.paymentMethod === selectedPaymentMethod
    );
    return balance?.balance || 0;
  }, [selectedPaymentMethod, paymentMethodBalances]);

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
          isTransfer: false,
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

  // 残高確認/修正
  const handleBalanceAdjustment = async (
    actualBalance: number,
    memo: string
  ) => {
    if (!user?.id || !selectedPaymentMethod) return;

    try {
      await createBalanceAdjustment(
        user.id,
        {
          date: new Date(),
          paymentMethod: selectedPaymentMethod,
          actualBalance,
          memo,
        },
        selectedPaymentMethodBalance
      );
      // ページをリロードして最新データを取得
      window.location.reload();
    } catch (error) {
      console.error("残高確認/修正エラー:", error);
      throw error;
    }
  };

  // 決済手段カードクリック時
  const handlePaymentMethodClick = (paymentMethod: string) => {
    setSelectedPaymentMethod(paymentMethod as PaymentMethodValue);
    setBalanceAdjustmentOpen(true);
  };

  // 削除処理
  const handleDelete = async (id: string) => {
    // 残高確認/修正の場合は、IDから残高調整IDを抽出して削除
    if (id.startsWith("adjustment-")) {
      const adjustmentId = id.replace("adjustment-", "");
      await deleteBalanceAdjustment(adjustmentId);
      // ページをリロードして最新データを取得
      window.location.reload();
    }
    // ダッシュボードでは通常の取引の削除はしない（取引一覧ページで行う）
  };

  // 振替登録
  const handleTransferSubmit = async (data: {
    date: Date;
    amount: number;
    from: string;
    to: string;
    description: string;
    memo?: string;
  }) => {
    try {
      const formData: TransactionFormValues = {
        date: data.date,
        amount: data.amount,
        categoryMain: "振替",
        categorySub: "口座間振替",
        description: data.description,
        paymentMethod: data.from, // 振替元を支払い方法とする
        isIncome: false,
        isTransfer: true,
        hasAdvance: false,
        transfer: {
          from: data.from as PaymentMethodValue,
          to: data.to as PaymentMethodValue,
        },
        memo: data.memo || "",
      };
      const transactionData = transformFormDataToTransaction(formData);
      await createTransaction(transactionData);
    } catch (error) {
      console.error("振替登録エラー:", error);
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
        showTransferButton
        onTransferClick={() => setTransferDialogOpen(true)}
      />

      {/* 期間別統計カード */}
      <MonthlyStatsCards
        stats={periodStats}
        loading={loading}
        expenseDetails={expenseDetails}
        advanceBalance={balance}
        period={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />

      {/* 決済手段別残高 */}
      <PaymentMethodBalances
        balances={paymentMethodBalances}
        onBalanceClick={handlePaymentMethodClick}
      />

      <TransactionList
        title="最近の取引"
        transactions={recentTransactions}
        loading={loading}
        onAddClick={() => setFormOpen(true)}
        onViewAllClick={() => router.push("/transactions")}
        onDelete={handleDelete}
      />

      <TransactionFormNew
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

      <BalanceAdjustmentDialog
        open={balanceAdjustmentOpen}
        onOpenChange={setBalanceAdjustmentOpen}
        paymentMethod={selectedPaymentMethod}
        expectedBalance={selectedPaymentMethodBalance}
        onSubmit={handleBalanceAdjustment}
      />

      <TransferFormDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        onSubmit={handleTransferSubmit}
      />
    </DashboardTemplate>
  );
}
