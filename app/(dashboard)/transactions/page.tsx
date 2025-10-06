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
        paymentMethod: data.paymentMethod as any,
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
          <h1 className="text-3xl font-bold">取引一覧</h1>
          <p className="text-gray-600 mt-2">すべての収支を確認・管理できます</p>
        </div>
        <Button onClick={() => setFormOpen(true)} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          新規追加
        </Button>
      </div>

      {/* トランザクション一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>最近の取引</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">読み込み中...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">まだ取引がありません</p>
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                最初の取引を追加
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium">{transaction.description}</h3>
                      <Badge
                        variant={transaction.isIncome ? "default" : "secondary"}
                      >
                        {transaction.isIncome ? "収入" : "支出"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        {format(transaction.date, "yyyy年M月d日(E)", {
                          locale: ja,
                        })}
                      </span>
                      <span>
                        {transaction.category.main} / {transaction.category.sub}
                      </span>
                      <span>
                        {getPaymentMethodLabel(transaction.paymentMethod)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-xl font-bold ${
                        transaction.isIncome
                          ? "text-green-600"
                          : "text-gray-900"
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
