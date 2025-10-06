/**
 * トランザクション一覧ページ
 */

"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks";
import { TransactionForm } from "@/components/organisms/TransactionForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { TransactionFormValues } from "@/lib/validations/transaction";
import { getPaymentMethodLabel } from "@/constants/paymentMethods";

export default function TransactionsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const { transactions, loading, createTransaction } = useTransactions();

  const handleSubmit = async (data: TransactionFormValues) => {
    try {
      await createTransaction({
        date: data.date,
        amount: data.amount,
        category: {
          main: data.categoryMain,
          sub: data.categorySub,
        },
        description: data.description,
        paymentMethod: data.paymentMethod as
          | "olive"
          | "sony_bank"
          | "d_payment"
          | "d_card"
          | "paypay"
          | "cash"
          | "other",
        isIncome: data.isIncome,
      });
    } catch (error) {
      console.error("トランザクション作成エラー:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            取引一覧
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            すべての収支を確認・管理できます
          </p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          size="lg"
          className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30 px-8"
        >
          <Plus className="mr-2 h-5 w-5" />
          新規追加
        </Button>
      </div>

      {/* トランザクション一覧 */}
      <Card className="border-0 shadow-soft rounded-3xl">
        <CardHeader>
          <CardTitle className="text-2xl">最近の取引</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">読み込み中...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
              <p className="text-gray-500 mb-6 text-lg">まだ取引がありません</p>
              <Button
                onClick={() => setFormOpen(true)}
                className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30"
              >
                <Plus className="mr-2 h-4 w-4" />
                最初の取引を追加
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-gray-100 hover:to-gray-200/50 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {transaction.description}
                      </h3>
                      <Badge
                        variant={transaction.isIncome ? "default" : "secondary"}
                        className="rounded-full px-3"
                      >
                        {transaction.isIncome ? "収入" : "支出"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="px-3 py-1 rounded-full bg-white/80">
                        {format(transaction.date, "yyyy年M月d日(E)", {
                          locale: ja,
                        })}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-white/80">
                        {transaction.category.main} / {transaction.category.sub}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-white/80">
                        {getPaymentMethodLabel(transaction.paymentMethod)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold px-4 py-2 rounded-xl ${
                        transaction.isIncome
                          ? "text-emerald-600 bg-emerald-50"
                          : "text-gray-900 bg-gray-200/50"
                      }`}
                    >
                      {transaction.isIncome ? "+" : "-"}¥
                      {transaction.amount.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* トランザクションフォーム */}
      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        mode="create"
      />
    </div>
  );
}
