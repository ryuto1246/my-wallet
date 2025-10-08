/**
 * トランザクション一覧ページ
 */

"use client";

import { useState, useMemo } from "react";
import { useTransactions, useBalanceAdjustments, useAuth } from "@/hooks";
import {
  deleteBalanceAdjustment,
  createBalanceAdjustment,
} from "@/lib/firebase";
import { DashboardTemplate } from "@/components/templates";
import {
  PageHeader,
  TransactionList,
  TransactionFormNew,
  BatchImageRecognitionDialog,
  TransferFormDialog,
  BalanceAdjustmentDialog,
} from "@/components/organisms";
import { TransactionFormValues } from "@/lib/validations/transaction";
import {
  transformFormDataToTransaction,
  mergeTransactionsAndAdjustments,
  calculatePaymentMethodBalances,
} from "@/lib/helpers";
import type { TransactionInput, PaymentMethodValue } from "@/types/transaction";

export default function TransactionsPage() {
  const { user } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [batchImageDialogOpen, setBatchImageDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [balanceAdjustmentOpen, setBalanceAdjustmentOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<
    string | null
  >(null);
  const [editingAdjustmentId, setEditingAdjustmentId] = useState<string | null>(
    null
  );
  const {
    transactions,
    loading,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions();
  const { adjustments } = useBalanceAdjustments();

  // 取引と残高調整を統合
  const allTransactions = useMemo(() => {
    return mergeTransactionsAndAdjustments(transactions, adjustments);
  }, [transactions, adjustments]);

  // 決済手段別の残高を計算（編集モード用）
  const paymentMethodBalances = useMemo(() => {
    return calculatePaymentMethodBalances(transactions, adjustments);
  }, [transactions, adjustments]);

  const handleSubmit = async (data: TransactionFormValues) => {
    try {
      const transactionData = transformFormDataToTransaction(data);
      if (editingTransactionId) {
        // 編集モード
        await updateTransaction(editingTransactionId, transactionData);
        setEditingTransactionId(null);
      } else {
        // 新規作成モード
        await createTransaction(transactionData);
      }
    } catch (error) {
      console.error("トランザクション作成/更新エラー:", error);
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
          // 元の店舗名を保持（画像認識時）
          originalMerchantName: data.ai?.originalMerchantName,
        };
        const transactionData = transformFormDataToTransaction(formData);
        await createTransaction(transactionData);
      }
    } catch (error) {
      console.error("一括登録エラー:", error);
      throw error;
    }
  };

  // 削除処理
  const handleDelete = async (id: string) => {
    // 残高確認/修正の場合は、IDから残高調整IDを抽出して削除
    if (id.startsWith("adjustment-")) {
      const adjustmentId = id.replace("adjustment-", "");
      await deleteBalanceAdjustment(adjustmentId);
      // ページをリロードして最新データを取得
      window.location.reload();
    } else {
      await deleteTransaction(id);
    }
  };

  // 編集処理
  const handleEdit = (id: string) => {
    // 残高確認/修正の場合
    if (id.startsWith("adjustment-")) {
      const adjustmentId = id.replace("adjustment-", "");
      setEditingAdjustmentId(adjustmentId);
      setBalanceAdjustmentOpen(true);
      return;
    }

    // 振替の場合
    const transaction = transactions.find((t) => t.id === id);
    if (transaction?.transfer) {
      setEditingTransactionId(id);
      setTransferDialogOpen(true);
      return;
    }

    // 通常の取引
    setEditingTransactionId(id);
    setFormOpen(true);
  };

  // フォームを閉じるときに編集モードをリセット
  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingTransactionId(null);
    }
  };

  // 振替ダイアログを閉じるときに編集モードをリセット
  const handleTransferDialogClose = (open: boolean) => {
    setTransferDialogOpen(open);
    if (!open) {
      setEditingTransactionId(null);
    }
  };

  // 残高調整ダイアログを閉じるときに編集モードをリセット
  const handleBalanceAdjustmentClose = (open: boolean) => {
    setBalanceAdjustmentOpen(open);
    if (!open) {
      setEditingAdjustmentId(null);
    }
  };

  // 編集中の取引データを取得
  const editingTransaction = editingTransactionId
    ? transactions.find((t) => t.id === editingTransactionId)
    : null;

  // 振替登録・更新
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

      if (editingTransactionId) {
        // 編集モード
        await updateTransaction(editingTransactionId, transactionData);
        setEditingTransactionId(null);
      } else {
        // 新規作成モード
        await createTransaction(transactionData);
      }
    } catch (error) {
      console.error("振替登録・更新エラー:", error);
      throw error;
    }
  };

  // 残高確認/修正
  const handleBalanceAdjustment = async (
    actualBalance: number,
    memo: string
  ) => {
    if (!user?.id) return;

    // 編集中の調整を取得
    const editingAdjustment = editingAdjustmentId
      ? adjustments.find((a) => a.id === editingAdjustmentId)
      : null;

    if (!editingAdjustment) return;

    try {
      // 既存の調整を削除して新しい調整を作成
      await deleteBalanceAdjustment(editingAdjustmentId!);

      const balance = paymentMethodBalances.find(
        (b) => b.paymentMethod === editingAdjustment.paymentMethod
      );

      await createBalanceAdjustment(
        user.id,
        {
          date: editingAdjustment.date,
          paymentMethod: editingAdjustment.paymentMethod,
          actualBalance,
          memo,
        },
        balance?.balance || 0
      );

      setEditingAdjustmentId(null);
      // ページをリロードして最新データを取得
      window.location.reload();
    } catch (error) {
      console.error("残高確認/修正エラー:", error);
      throw error;
    }
  };

  // 通常のフォームのデフォルト値（振替以外）
  const formDefaultValues: Partial<TransactionFormValues> | undefined =
    editingTransaction && !editingTransaction.transfer
      ? {
          date: editingTransaction.date,
          amount: editingTransaction.amount,
          categoryMain: editingTransaction.category.main,
          categorySub: editingTransaction.category.sub,
          description: editingTransaction.description,
          paymentMethod: editingTransaction.paymentMethod,
          isIncome: editingTransaction.isIncome,
          hasAdvance: !!editingTransaction.advance,
          advance: editingTransaction.advance
            ? {
                type: editingTransaction.advance.type,
                totalAmount: editingTransaction.advance.totalAmount,
                advanceAmount: editingTransaction.advance.advanceAmount,
                personalAmount: editingTransaction.advance.personalAmount,
                memo: editingTransaction.advance.memo || "",
              }
            : undefined,
          // 画像から読み取った場合は元の店舗名をメモ欄に表示
          memo:
            editingTransaction.imageUrl &&
            editingTransaction.ai?.originalMerchantName
              ? `元の店舗名: ${editingTransaction.ai.originalMerchantName}`
              : editingTransaction.memo || "",
          // 既存のAI情報を保持
          originalMerchantName: editingTransaction.ai?.originalMerchantName,
          userKeyword: editingTransaction.ai?.userKeyword,
        }
      : undefined;

  // 振替フォームのデフォルト値
  const transferDefaultValues = editingTransaction?.transfer
    ? {
        date: editingTransaction.date,
        amount: editingTransaction.amount,
        from: editingTransaction.transfer.from,
        to: editingTransaction.transfer.to,
        description: editingTransaction.description,
        memo: editingTransaction.memo || "",
      }
    : undefined;

  // 残高調整のデフォルト値
  const editingAdjustment = editingAdjustmentId
    ? adjustments.find((a) => a.id === editingAdjustmentId)
    : null;

  const adjustmentPaymentMethod = editingAdjustment?.paymentMethod || null;
  const adjustmentExpectedBalance = editingAdjustment
    ? paymentMethodBalances.find(
        (b) => b.paymentMethod === editingAdjustment.paymentMethod
      )?.balance || 0
    : 0;

  return (
    <DashboardTemplate>
      <PageHeader
        title="取引一覧"
        showAddButton
        onAddClick={() => setFormOpen(true)}
        showImageButton
        onImageClick={() => setBatchImageDialogOpen(true)}
        showTransferButton
        onTransferClick={() => setTransferDialogOpen(true)}
      />

      <TransactionList
        title="最近の取引"
        transactions={allTransactions}
        loading={loading}
        showAll
        showBadge
        showPaymentMethod
        dateFormat="yyyy年M月d日(E)"
        onAddClick={() => setFormOpen(true)}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      <TransactionFormNew
        key={editingTransactionId || "new"}
        open={formOpen}
        onOpenChange={handleFormClose}
        onSubmit={handleSubmit}
        mode={editingTransactionId ? "edit" : "create"}
        defaultValues={formDefaultValues}
      />

      <BatchImageRecognitionDialog
        open={batchImageDialogOpen}
        onOpenChange={setBatchImageDialogOpen}
        onBatchSubmit={handleBatchSubmit}
      />

      <TransferFormDialog
        key={editingTransactionId || "new-transfer"}
        open={transferDialogOpen}
        onOpenChange={handleTransferDialogClose}
        onSubmit={handleTransferSubmit}
        defaultValues={transferDefaultValues}
        mode={editingTransactionId ? "edit" : "create"}
      />

      <BalanceAdjustmentDialog
        key={editingAdjustmentId || "new-adjustment"}
        open={balanceAdjustmentOpen}
        onOpenChange={handleBalanceAdjustmentClose}
        paymentMethod={adjustmentPaymentMethod}
        expectedBalance={adjustmentExpectedBalance}
        onSubmit={handleBalanceAdjustment}
      />
    </DashboardTemplate>
  );
}
