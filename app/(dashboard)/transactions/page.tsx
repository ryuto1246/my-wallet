/**
 * トランザクション一覧ページ
 */

"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks";
import { DashboardTemplate } from "@/components/templates";
import {
  PageHeader,
  TransactionList,
  TransactionForm,
  BatchImageRecognitionDialog,
} from "@/components/organisms";
import { TransactionFormValues } from "@/lib/validations/transaction";
import { transformFormDataToTransaction } from "@/lib/helpers";
import type { TransactionInput } from "@/types/transaction";

export default function TransactionsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [batchImageDialogOpen, setBatchImageDialogOpen] = useState(false);
  const { transactions, loading, createTransaction } = useTransactions();

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
        title="取引一覧"
        showAddButton
        onAddClick={() => setFormOpen(true)}
        showImageButton
        onImageClick={() => setBatchImageDialogOpen(true)}
      />

      <TransactionList
        title="最近の取引"
        transactions={transactions}
        loading={loading}
        showAll
        showBadge
        showPaymentMethod
        dateFormat="yyyy年M月d日(E)"
        onAddClick={() => setFormOpen(true)}
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
