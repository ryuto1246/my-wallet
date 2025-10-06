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
} from "@/components/organisms";
import { TransactionFormValues } from "@/lib/validations/transaction";
import { transformFormDataToTransaction } from "@/lib/helpers";

export default function TransactionsPage() {
  const [formOpen, setFormOpen] = useState(false);
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

  return (
    <DashboardTemplate>
      <PageHeader
        title="取引一覧"
        description="すべての収支を確認・管理できます"
        showAddButton
        onAddClick={() => setFormOpen(true)}
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
    </DashboardTemplate>
  );
}
