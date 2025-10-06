/**
 * ダッシュボードページ
 */

"use client";

import { useState, useMemo } from "react";
import { useAuth, useTransactions } from "@/hooks";
import { TransactionForm } from "@/components/organisms/TransactionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, Wallet } from "lucide-react";
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
            ダッシュボード
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            ようこそ、{user?.displayName}さん
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

      {/* 月次サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-soft rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-emerald-50 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              今月の収入
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">
              ¥{monthlyStats.income.toLocaleString()}
            </div>
            {loading && (
              <p className="text-xs text-emerald-100">読み込み中...</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft rounded-3xl overflow-hidden bg-gradient-to-br from-rose-500 to-pink-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-rose-50 flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              今月の支出
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">
              ¥{monthlyStats.expense.toLocaleString()}
            </div>
            {loading && <p className="text-xs text-rose-100">読み込み中...</p>}
          </CardContent>
        </Card>

        <Card
          className={`border-0 shadow-soft rounded-3xl overflow-hidden ${
            monthlyStats.balance >= 0
              ? "bg-gradient-to-br from-blue-500 to-indigo-600"
              : "bg-gradient-to-br from-amber-500 to-orange-600"
          }`}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white/90 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              収支
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">
              {monthlyStats.balance >= 0 ? "+" : ""}¥
              {monthlyStats.balance.toLocaleString()}
            </div>
            {loading && <p className="text-xs text-white/80">読み込み中...</p>}
          </CardContent>
        </Card>
      </div>

      {/* 最近の取引 */}
      <Card className="border-0 shadow-soft rounded-3xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-2xl">最近の取引</CardTitle>
          {recentTransactions.length > 0 && (
            <Button variant="ghost" size="sm" className="rounded-full" asChild>
              <a href="/transactions">すべて表示 →</a>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">読み込み中...</div>
          ) : recentTransactions.length === 0 ? (
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
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-gray-100 hover:to-gray-200/50 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {transaction.description}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="px-3 py-1 rounded-full bg-white/80">
                        {format(transaction.date, "M/d(E)", { locale: ja })}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-white/80">
                        {transaction.category.main} / {transaction.category.sub}
                      </span>
                    </div>
                  </div>
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
