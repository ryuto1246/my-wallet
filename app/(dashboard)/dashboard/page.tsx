/**
 * ダッシュボードページ
 */

"use client";

import { useState, useMemo } from "react";
import { useAuth, useTransactions } from "@/hooks";
import { TransactionForm } from "@/components/organisms/TransactionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { TransactionFormValues } from "@/lib/validations/transaction";

export default function DashboardPage() {
  const { user } = useAuth();
  const { transactions, loading, createTransaction } = useTransactions();
  const [formOpen, setFormOpen] = useState(false);

  // 今月の収支を計算
  const monthlyStats = useMemo(() => {
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

    const income = monthlyTransactions
      .filter((t) => t.isIncome)
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = monthlyTransactions
      .filter((t) => !t.isIncome)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [transactions]);

  // 最近の取引（最新5件）
  const recentTransactions = useMemo(() => {
    return [...transactions].slice(0, 5);
  }, [transactions]);

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
          <h1 className="text-3xl font-bold">ダッシュボード</h1>
          <p className="text-gray-600 mt-2">
            ようこそ、{user?.displayName}さん
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          新規追加
        </Button>
      </div>

      {/* 月次サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              今月の収入
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ¥{monthlyStats.income.toLocaleString()}
            </div>
            {loading && (
              <p className="text-xs text-gray-500 mt-1">読み込み中...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              今月の支出
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ¥{monthlyStats.expense.toLocaleString()}
            </div>
            {loading && (
              <p className="text-xs text-gray-500 mt-1">読み込み中...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              収支
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                monthlyStats.balance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {monthlyStats.balance >= 0 ? "+" : ""}¥
              {monthlyStats.balance.toLocaleString()}
            </div>
            {loading && (
              <p className="text-xs text-gray-500 mt-1">読み込み中...</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 最近の取引 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>最近の取引</CardTitle>
          {recentTransactions.length > 0 && (
            <Button variant="ghost" size="sm" asChild>
              <a href="/transactions">すべて表示</a>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">読み込み中...</div>
          ) : recentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">まだ取引がありません</p>
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                最初の取引を追加
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{transaction.description}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                      <span>
                        {format(transaction.date, "M/d(E)", { locale: ja })}
                      </span>
                      <span>
                        {transaction.category.main} / {transaction.category.sub}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      transaction.isIncome ? "text-green-600" : "text-gray-900"
                    }`}
                  >
                    {transaction.isIncome ? "+" : "-"}¥
                    {transaction.amount.toLocaleString()}
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
