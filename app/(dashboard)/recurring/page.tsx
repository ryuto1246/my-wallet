/**
 * 固定費分析ページ（AI分析版）
 */

"use client";

import { useMemo, useState, useEffect } from "react";
import { useDashboardTransactions } from "@/hooks";
import { DashboardTemplate } from "@/components/templates";
import { PageHeader } from "@/components/organisms";
import { aggregateRecurringCandidates, calcMonthlyFixedTotal, RecurringExpense } from "@/lib/helpers/recurring";
import { Repeat, TrendingDown, Calendar, Loader2, RefreshCw } from "lucide-react";

export default function RecurringPage() {
  const { transactions, loading } = useDashboardTransactions();
  const [showVariableOnly, setShowVariableOnly] = useState(false);
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [monthsRange, setMonthsRange] = useState(6);

  // 選択した期間でフィルタ
  const filteredTransactions = useMemo(() => {
    if (!transactions.length) return [];
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - monthsRange);
    cutoff.setDate(1);
    cutoff.setHours(0, 0, 0, 0);
    return transactions.filter(t => new Date(t.date) >= cutoff);
  }, [transactions, monthsRange]);

  const candidates = useMemo(() => {
    if (!filteredTransactions.length) return [];
    return aggregateRecurringCandidates(
      filteredTransactions.map(t => ({
        date: new Date(t.date),
        description: t.description,
        amount: t.amount,
        isIncome: t.isIncome,
        category: t.category,
      })),
      2
    );
  }, [filteredTransactions]);

  const analyzeWithAI = async (data: RecurringExpense[]) => {
    if (!data.length) return;
    setAiLoading(true);
    setAiError(false);
    try {
      const res = await fetch('/api/ai/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates: data }),
      });
      if (!res.ok) throw new Error('AI analysis failed');
      const result: RecurringExpense[] = await res.json();
      setRecurring(result);
    } catch {
      setAiError(true);
      setRecurring(data);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (candidates.length > 0) {
      analyzeWithAI(candidates);
    } else if (!loading) {
      setRecurring([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates]);

  const fixedExpenses = recurring.filter(e => e.isFixed);
  const variableExpenses = recurring.filter(e => !e.isFixed);
  const monthlyFixedTotal = calcMonthlyFixedTotal(recurring);

  const displayed = showVariableOnly ? variableExpenses : recurring;
  const isPageLoading = loading || (aiLoading && recurring.length === 0);

  return (
    <DashboardTemplate>
      <PageHeader title="固定費分析" userName={undefined} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* サイドバー: 期間選択 */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 p-4 space-y-2">
            <p className="text-sm font-semibold text-gray-700">分析期間</p>
            {[3, 6, 12, 24].map((m) => (
              <button
                key={m}
                onClick={() => setMonthsRange(m)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                  monthsRange === m
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                直近{m}ヶ月
              </button>
            ))}
          </div>

          {/* サマリー */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Repeat className="h-4 w-4 text-blue-500" />
              <p className="text-xs text-gray-600">固定費（月間）</p>
            </div>
            <p className="text-xl font-bold text-blue-700">
              ¥{monthlyFixedTotal.toLocaleString('ja-JP')}
            </p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-emerald-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-emerald-500" />
              <p className="text-xs text-gray-600">固定費項目</p>
            </div>
            <p className="text-xl font-bold text-emerald-700">{fixedExpenses.length}件</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-orange-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-orange-500" />
              <p className="text-xs text-gray-600">変動費項目</p>
            </div>
            <p className="text-xl font-bold text-orange-700">{variableExpenses.length}件</p>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="lg:col-span-3 space-y-3">
          {/* フィルター & 再分析 */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
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
            <button
              onClick={() => analyzeWithAI(candidates)}
              disabled={aiLoading || !candidates.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {aiLoading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <RefreshCw className="h-3.5 w-3.5" />
              }
              AI再分析
            </button>
          </div>

          {/* AI分析中バナー */}
          {aiLoading && recurring.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-xl px-4 py-2">
              <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
              AIが固定費・変動費を再分析中...
            </div>
          )}

          {/* エラーバナー */}
          {aiError && (
            <div className="text-sm text-orange-600 bg-orange-50 rounded-xl px-4 py-2">
              AI分析に失敗しました。アルゴリズムによる結果を表示しています。
            </div>
          )}

          {/* リスト */}
          {isPageLoading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              {aiLoading ? 'AIが分析中...' : '読み込み中...'}
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
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
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">月平均</th>
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
                          <div className="flex flex-col items-center gap-0.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                expense.isFixed
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}
                            >
                              {expense.isFixed ? '固定費' : '変動費'}
                            </span>
                            {expense.aiReason && (
                              <span className="text-[10px] text-gray-400">{expense.aiReason}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardTemplate>
  );
}
