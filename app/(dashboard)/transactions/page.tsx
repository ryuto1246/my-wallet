/**
 * トランザクション一覧ページ
 */

"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useTransactions, useBalanceAdjustments, useAuth } from "@/hooks";
import { PAYMENT_METHODS } from "@/constants/paymentMethods";
import {
  deleteBalanceAdjustment,
  createBalanceAdjustment,
} from "@/lib/firebase";
import { getTransactions } from "@/lib/firebase/transactions";
import { useTransactionStore } from "@/lib/store/transactionStore";
import { DashboardTemplate } from "@/components/templates";
import {
  PageHeader,
  TransactionList,
  TransactionFormNew,
  BatchImageRecognitionDialog,
  TransferFormDialog,
  BalanceAdjustmentDialog,
} from "@/components/organisms";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionFormValues } from "@/lib/validations/transaction";
import {
  transformFormDataToTransaction,
  convertTransactionInputToFormValues,
  buildTransferFormValues,
  mergeTransactionsAndAdjustments,
  calculatePaymentMethodBalances,
} from "@/lib/helpers";
import type {
  TransactionInput,
  PaymentMethodValue,
} from "@/types/transaction";
import type { InlineEditData } from "@/components/molecules";

export default function TransactionsPage() {
  const { user } = useAuth();
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<
    PaymentMethodValue | ""
  >("");
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
  const { adjustments, refetch: refetchAdjustments } = useBalanceAdjustments();

  // 取引手段フィルター
  const filter = useMemo(
    () =>
      paymentMethodFilter
        ? { paymentMethod: paymentMethodFilter }
        : {},
    [paymentMethodFilter]
  );

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
  } = useTransactions(filter);

  const {
    setCurrentPage,
    lastDoc,
    pageHistory,
    setLastDoc,
    setPageHistory,
    setTransactions,
    setLoading,
    setHasMore,
    filter: currentFilter,
  } = useTransactionStore();

  // スクロール位置とページネーション状態を保存・復元
  const scrollPositionRef = useRef<number>(0);
  const savedPageRef = useRef<number>(1);
  const savedLastDocRef = useRef<typeof lastDoc>(null);
  const savedPageHistoryRef = useRef<typeof pageHistory>([null]);
  const isDialogOpenRef = useRef<boolean>(false);
  const [shouldRestorePage, setShouldRestorePage] = useState(false);

  // ダイアログの開閉時にスクロール位置とページネーション状態を保存・復元
  useEffect(() => {
    const isAnyDialogOpen =
      formOpen ||
      batchImageDialogOpen ||
      transferDialogOpen ||
      balanceAdjustmentOpen;

    // ダイアログが開かれた時（false → true）に現在の状態を保存
    if (isAnyDialogOpen && !isDialogOpenRef.current) {
      scrollPositionRef.current = window.scrollY;
      savedPageRef.current = currentPage;
      savedLastDocRef.current = lastDoc;
      savedPageHistoryRef.current = [...pageHistory];
    }

    // ダイアログが閉じた時（true → false）に復元フラグを設定
    if (!isAnyDialogOpen && isDialogOpenRef.current) {
      setShouldRestorePage(true);
    }

    isDialogOpenRef.current = isAnyDialogOpen;
  }, [
    formOpen,
    batchImageDialogOpen,
    transferDialogOpen,
    balanceAdjustmentOpen,
    currentPage,
    lastDoc,
    pageHistory,
  ]);

  // ページとスクロール位置を復元
  const restoreScrollPosition = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (scrollPositionRef.current > 0) {
          window.scrollTo({ top: scrollPositionRef.current, behavior: "auto" });
        }
        setShouldRestorePage(false);
      });
    });
  }, []);

  useEffect(() => {
    if (!shouldRestorePage || loading || !user) return;

    const savedPage = savedPageRef.current;
    const savedLastDoc = savedLastDocRef.current;
    const savedPageHistory = savedPageHistoryRef.current;

    // ページが変わっていた場合、復元する
    if (currentPage !== savedPage && savedLastDoc) {
      const restorePage = async () => {
        setLoading(true);
        try {
          // savedPage > 1 の場合、pageHistory[savedPage - 2] が開始位置
          const startDoc =
            savedPage > 1
              ? savedPageHistory[savedPage - 2] || undefined
              : undefined;

          const {
            transactions: restoredTransactions,
            lastDoc: restoredLastDoc,
          } = await getTransactions(user.id, currentFilter, 20, startDoc);

          setTransactions(restoredTransactions);
          setLastDoc(restoredLastDoc);
          setPageHistory(savedPageHistory);
          setCurrentPage(savedPage);
          setHasMore(restoredTransactions.length === 20);
          restoreScrollPosition();
        } catch (error) {
          console.error("ページ復元エラー:", error);
          setShouldRestorePage(false);
        } finally {
          setLoading(false);
        }
      };

      restorePage();
    } else {
      restoreScrollPosition();
    }
  }, [
    shouldRestorePage,
    loading,
    currentPage,
    user,
    currentFilter,
    setCurrentPage,
    setLastDoc,
    setPageHistory,
    setTransactions,
    setLoading,
    setHasMore,
    restoreScrollPosition,
  ]);

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

  // フィルターが有効な場合、残高調整も同じ支払い手段で絞り込む
  const adjustmentsForDisplay = useMemo(
    () =>
      paymentMethodFilter
        ? adjustments.filter((a) => a.paymentMethod === paymentMethodFilter)
        : adjustments,
    [adjustments, paymentMethodFilter]
  );

  // 取引と残高調整を統合（現在ページの日付範囲に該当する調整のみ）
  const allTransactions = useMemo(
    () => mergeTransactionsAndAdjustments(transactions, adjustmentsForDisplay, dateRange),
    [transactions, adjustmentsForDisplay, dateRange]
  );

  const handleSubmit = async (data: TransactionFormValues) => {
    try {
      const transactionData = transformFormDataToTransaction(data);
      if (editingTransactionId) {
        await updateTransaction(editingTransactionId, transactionData);
        setEditingTransactionId(null);
      } else {
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
      for (const data of transactionsData) {
        const transactionData = transformFormDataToTransaction(
          convertTransactionInputToFormValues(data)
        );
        await createTransaction(transactionData);
      }
    } catch (error) {
      console.error("一括登録エラー:", error);
      throw error;
    }
  };

  // インライン編集の保存
  const handleInlineUpdate = async (id: string, data: InlineEditData) => {
    try {
      await updateTransaction(id, {
        date: data.date,
        amount: data.amount,
        description: data.description,
        category: { main: data.categoryMain, sub: data.categorySub },
        isIncome: data.isIncome,
      });
    } catch (error) {
      console.error("インライン更新エラー:", error);
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
    // 編集ダイアログを開く前に、スクロール位置を保存
    scrollPositionRef.current = window.scrollY;

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
      const transactionData = transformFormDataToTransaction(
        buildTransferFormValues(data)
      );
      if (editingTransactionId) {
        await updateTransaction(editingTransactionId, transactionData);
        setEditingTransactionId(null);
      } else {
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
          isTransfer: false,
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

  // 残高調整のデフォルト値
  const adjustmentDefaultValues = editingAdjustment
    ? {
        date:
          adjustmentDate && !isNaN(adjustmentDate.getTime())
            ? adjustmentDate
            : editingAdjustment.date,
        actualBalance: editingAdjustment.actualBalance,
        memo: editingAdjustment.memo || "",
      }
    : undefined;

  // 指定日時点での期待残高を計算
  const adjustmentExpectedBalance = useMemo(() => {
    if (!editingAdjustment) return 0;

    // 日付が無効な場合は現在の日付を使用
    const validDate =
      adjustmentDate && !isNaN(adjustmentDate.getTime())
        ? adjustmentDate
        : editingAdjustment.date;

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

      {/* 取引手段フィルター */}
      <div className="mb-4 max-w-4xl mx-auto">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          取引手段
        </label>
        <Select
          value={paymentMethodFilter || "all"}
          onValueChange={(value) =>
            setPaymentMethodFilter(value === "all" ? "" : (value as PaymentMethodValue))
          }
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="取引手段でフィルター" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {PAYMENT_METHODS.map((pm) => (
              <SelectItem key={pm.value} value={pm.value}>
                {pm.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
        onInlineUpdate={handleInlineUpdate}
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
        defaultValues={adjustmentDefaultValues}
      />
    </DashboardTemplate>
  );
}
