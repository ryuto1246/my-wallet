/**
 * 固定費分析ページ
 */

"use client";

import { useMemo, useState } from "react";
import { useDashboardTransactions } from "@/hooks";
import { DashboardTemplate } from "@/components/templates";
import { PageHeader } from "@/components/organisms";
import { detectRecurringExpenses, calcMonthlyFixedTotal } from "@/lib/helpers/recurring";
import { Repeat, TrendingDown, Calendar } from "lucide-react";

export default function RecurringPage() {
  const { transactions, loading } = useDashboardTransactions();
  const [showVariableOnly, setShowVariableOnly] = useState(false);

  const recurring = useMemo(() => {
    if (!transactions.length) return [];
    const mapped = transactions.map(t => ({
      date: new Date(t.date),
      description: t.description,
      amount: t.amount,
      isIncome: t.isIncome,
      category: t.category,
    }));
    return detectRecurringExpenses(mapped, 2);
  }, [transactions]);

  const fixedExpenses = recurring.filter(e => e.isFixed);
  const variableExpenses = recurring.filter(e => !e.isFixed);
  const monthlyFixedTotal = calcMonthlyFixedTotal(recurring);

  const displayed = showVariableOnly ? variableExpenses : recurring;

  return (
    <DashboardTemplate>
      <PageHeader title="固定費分析" userName={undefined} />

      {/* サマリーカード */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Repeat className="h-4 w-4 text-blue-500" />
            <p className="text-sm text-gray-600">固定費（月間合計）</p>
          </div>
          <p className="text-2xl font-bold text-blue-700">
            ¥{monthlyFixedTotal.toLocaleString('ja-JP')}
          </p>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-emerald-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-emerald-500" />
            <p className="text-sm text-gray-600">固定費項目数</p>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{fixedExpenses.length}件</p>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-orange-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-orange-500" />
            <p className="text-sm text-gray-600">変動費項目数</p>
          </div>
          <p className="text-2xl font-bold text-orange-700">{variableExpenses.length}件</p>
        </div>
      </div>

      {/* フィルター */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowVariableOnly(false)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            !showVariableOnly
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          すべて
        </button>
        <button
          onClick={() => setShowVariableOnly(true)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            showVariableOnly
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          変動費のみ
        </button>
      </div>

      {/* リスト */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">読み込み中...</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          データが不足しています。2ヶ月以上のデータが必要です。
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">品目</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">カテゴリ</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">平均金額</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">発生月数</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">種別</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayed.map((expense, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {expense.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {expense.category.main} / {expense.category.sub}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-right text-gray-900">
                      ¥{expense.averageAmount.toLocaleString('ja-JP')}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {expense.months.length}ヶ月
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          expense.isFixed
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {expense.isFixed ? '固定費' : '変動費'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardTemplate>
  );
}
