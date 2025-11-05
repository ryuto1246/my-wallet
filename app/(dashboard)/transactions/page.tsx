/**
 * トランザクション一覧ページ
 */

"use client";

import { useState, useMemo, useRef, useEffect } from "react";
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
import type {
  TransactionInput,
  PaymentMethodValue,
  Transaction,
} from "@/types/transaction";

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
  const [adjustmentDate, setAdjustmentDate] = useState<Date>(new Date());
  const {
    transactions,
    loading,
    currentPage,
    hasMore,
    hasPrevious,
    nextPage,
    previousPage,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions();
  const { adjustments, refetch: refetchAdjustments } = useBalanceAdjustments();

  // スクロール位置とページネーション状態を保存・復元
  const scrollPositionRef = useRef<number>(0);
  const savedPageRef = useRef<number>(1);
  const isDialogOpenRef = useRef<boolean>(false);
  const shouldRestorePageRef = useRef<boolean>(false);
  const isRestoringPageRef = useRef<boolean>(false);

  // ダイアログの開閉時にスクロール位置とページ番号を保存
  useEffect(() => {
    const isAnyDialogOpen =
      formOpen ||
      batchImageDialogOpen ||
      transferDialogOpen ||
      balanceAdjustmentOpen;

    // ダイアログが開かれた時（false → true）にスクロール位置とページ番号を保存
    if (isAnyDialogOpen && !isDialogOpenRef.current) {
      scrollPositionRef.current = window.scrollY;
      savedPageRef.current = currentPage;
      shouldRestorePageRef.current = false;
      isRestoringPageRef.current = false;
    }

    // ダイアログが閉じた時（true → false）に復元フラグを設定
    if (!isAnyDialogOpen && isDialogOpenRef.current) {
      shouldRestorePageRef.current = true;

      // 読み込み完了後、DOMの更新が確実に反映されるまで待つ
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (scrollPositionRef.current > 0) {
            window.scrollTo({
              top: scrollPositionRef.current,
              behavior: "auto",
            });
          }
        });
      });
    }

    isDialogOpenRef.current = isAnyDialogOpen;
  }, [
    formOpen,
    batchImageDialogOpen,
    transferDialogOpen,
    balanceAdjustmentOpen,
    currentPage,
  ]);

  // ページ情報を復元（読み込み完了後）
  useEffect(() => {
    if (!shouldRestorePageRef.current || loading || isRestoringPageRef.current)
      return;

    const savedPage = savedPageRef.current;

    // 現在のページが1に戻ってしまい、保存したページが1より大きい場合、ページを復元
    if (currentPage === 1 && savedPage > 1 && hasMore) {
      isRestoringPageRef.current = true;

      // ページを復元するために、必要な回数だけnextPageを呼び出す
      const restorePage = async () => {
        const targetPage = savedPageRef.current;
        const pagesToMove = Math.min(targetPage - 1, 10); // 最大10ページまで

        // 読み込み完了を待ってから開始
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 必要なページ数だけ移動
        for (let i = 0; i < pagesToMove; i++) {
          await nextPage();
          // 各ページ移動後に読み込み完了を待つ（十分な時間を確保）
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        // 復元完了
        shouldRestorePageRef.current = false;
        isRestoringPageRef.current = false;
      };

      // 読み込み完了を待ってからページを復元
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          restorePage();
        });
      });
    } else if (currentPage === savedPage) {
      // ページが既に正しい場合はフラグをクリア
      shouldRestorePageRef.current = false;
      isRestoringPageRef.current = false;
    }
  }, [loading, currentPage, hasMore, nextPage]);

  // 取引と残高調整を統合
  // 前回のキーと結果を保存して、内容が変わったときだけ再計算する
  const prevTransactionsKeyRef = useRef<string>("");
  const prevAdjustmentsKeyRef = useRef<string>("");
  const prevResultRef = useRef<Transaction[]>([]);

  const transactionsKey = transactions.map((t) => t.id).join(",");
  const adjustmentsKey = adjustments
    .map((a) => `${a.id}:${a.updatedAt?.getTime() || a.createdAt.getTime()}`)
    .join(",");

  // 現在のページの取引の日付範囲を計算
  const dateRange = useMemo(() => {
    if (transactions.length === 0) return undefined;

    const dates = transactions.map((t) => new Date(t.date));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // 日付範囲を1日拡張（前後の日付も含める）
    minDate.setDate(minDate.getDate() - 1);
    maxDate.setDate(maxDate.getDate() + 1);

    return { startDate: minDate, endDate: maxDate };
  }, [transactions]);

  const allTransactions = useMemo(() => {
    // 内容が変わっていない場合は前回の結果を返す
    if (
      prevTransactionsKeyRef.current === transactionsKey &&
      prevAdjustmentsKeyRef.current === adjustmentsKey
    ) {
      return prevResultRef.current;
    }

    // 内容が変わった場合のみ再計算
    // 現在のページの取引の日付範囲に該当する残高調整のみを統合
    const result = mergeTransactionsAndAdjustments(
      transactions,
      adjustments,
      dateRange
    );
    prevTransactionsKeyRef.current = transactionsKey;
    prevAdjustmentsKeyRef.current = adjustmentsKey;
    prevResultRef.current = result;
    return result;
  }, [transactions, adjustments, transactionsKey, adjustmentsKey, dateRange]);

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
    try {
      // 残高確認/修正の場合は、IDから残高調整IDを抽出して削除
      if (id.startsWith("adjustment-")) {
        const adjustmentId = id.replace("adjustment-", "");
        await deleteBalanceAdjustment(adjustmentId);
        // 残高調整データを再取得
        await refetchAdjustments();
      } else {
        await deleteTransaction(id);
      }
    } catch (error) {
      throw error;
    }
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
      setAdjustmentDate(new Date());
    }
  };

  // 編集開始時に日付を設定
  const handleEdit = (id: string) => {
    // 残高確認/修正の場合
    if (id.startsWith("adjustment-")) {
      const adjustmentId = id.replace("adjustment-", "");
      const adjustment = adjustments.find((a) => a.id === adjustmentId);
      if (adjustment) {
        setAdjustmentDate(adjustment.date);
      }
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
    date: Date,
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

      // 指定日時点での残高を計算
      const balances = calculatePaymentMethodBalances(
        transactions,
        adjustments.filter((a) => a.id !== editingAdjustmentId),
        date
      );
      const balance = balances.find(
        (b) => b.paymentMethod === editingAdjustment.paymentMethod
      );

      await createBalanceAdjustment(
        user.id,
        {
          date,
          paymentMethod: editingAdjustment.paymentMethod,
          actualBalance,
          memo,
        },
        balance?.balance || 0
      );

      setEditingAdjustmentId(null);
      // 残高調整データを再取得
      await refetchAdjustments();
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

  // 指定日時点での期待残高を計算
  const adjustmentExpectedBalance = useMemo(() => {
    if (!editingAdjustment) return 0;

    // 日付が無効な場合は現在の日付を使用
    const validDate =
      adjustmentDate && !isNaN(adjustmentDate.getTime())
        ? adjustmentDate
        : new Date();

    const balances = calculatePaymentMethodBalances(
      transactions,
      adjustments.filter((a) => a.id !== editingAdjustmentId),
      validDate
    );
    return (
      balances.find((b) => b.paymentMethod === editingAdjustment.paymentMethod)
        ?.balance || 0
    );
  }, [
    editingAdjustment,
    transactions,
    adjustments,
    editingAdjustmentId,
    adjustmentDate,
  ]);

  // 日付変更時の処理
  const handleAdjustmentDateChange = (date: Date) => {
    setAdjustmentDate(date);
  };

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
        currentPage={currentPage}
        totalPages={!hasMore ? currentPage : undefined}
        hasMore={hasMore}
        hasPrevious={hasPrevious}
        onAddClick={() => setFormOpen(true)}
        onNextPage={nextPage}
        onPreviousPage={previousPage}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      <TransactionFormNew
        key={`transaction-${editingTransactionId || "new"}`}
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
        key={`transfer-${editingTransactionId || "new"}`}
        open={transferDialogOpen}
        onOpenChange={handleTransferDialogClose}
        onSubmit={handleTransferSubmit}
        defaultValues={transferDefaultValues}
        mode={editingTransactionId ? "edit" : "create"}
      />

      <BalanceAdjustmentDialog
        key={`adjustment-${editingAdjustmentId || "new"}`}
        open={balanceAdjustmentOpen}
        onOpenChange={handleBalanceAdjustmentClose}
        paymentMethod={adjustmentPaymentMethod}
        expectedBalance={adjustmentExpectedBalance}
        onSubmit={handleBalanceAdjustment}
        onDateChange={handleAdjustmentDateChange}
      />
    </DashboardTemplate>
  );
}
