/**
 * 固定費・定期支出の検出ユーティリティ
 */

export interface RecurringExpense {
  description: string;
  category: { main: string; sub: string };
  amounts: number[];           // 各月の金額
  averageAmount: number;       // 平均金額
  frequency: number;           // 月あたりの発生回数
  months: string[];            // YYYY-MM 形式の発生月
  isFixed: boolean;            // 固定費かどうか
  variance: number;            // 金額の分散率（0=完全固定）
  aiReason?: string;           // AI判定理由
}

/**
 * 取引リストから定期支出候補を集計（isFixed はアルゴリズムで仮設定）
 * AI分析の前処理として使用
 */
export function aggregateRecurringCandidates(
  transactions: Array<{
    date: Date;
    description: string;
    amount: number;
    isIncome: boolean;
    category: { main: string; sub: string };
  }>,
  minMonths = 2
): RecurringExpense[] {
  // 支出のみを対象（振替・口座間振替は除外）
  const expenses = transactions.filter(t => !t.isIncome && t.amount > 0 && t.category.main !== '振替');

  // 月ごとの合計金額を集計
  type GroupEntry = { monthlyTotals: Map<string, number>; category: { main: string; sub: string } };
  const grouped = new Map<string, GroupEntry>();

  expenses.forEach(t => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const key = t.description.trim();

    if (!grouped.has(key)) {
      grouped.set(key, { monthlyTotals: new Map(), category: t.category });
    }
    const entry = grouped.get(key)!;
    entry.monthlyTotals.set(monthKey, (entry.monthlyTotals.get(monthKey) ?? 0) + t.amount);
    if (!entry.category.main) entry.category = t.category;
  });

  const results: RecurringExpense[] = [];

  grouped.forEach((entry, description) => {
    if (entry.monthlyTotals.size < minMonths) return;

    // amounts = 各月の合計金額（月平均の計算に使う）
    const months = Array.from(entry.monthlyTotals.keys()).sort();
    const amounts = months.map(m => entry.monthlyTotals.get(m)!);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = avg > 0
      ? Math.sqrt(amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / amounts.length) / avg
      : 0;

    results.push({
      description,
      category: entry.category,
      amounts,
      averageAmount: Math.round(avg),
      frequency: amounts.length / months.length,
      months,
      isFixed: variance < 0.05,
      variance,
    });
  });

  return results.sort((a, b) => b.averageAmount - a.averageAmount);
}

/**
 * 固定費の月間合計を計算
 */
export function calcMonthlyFixedTotal(expenses: RecurringExpense[]): number {
  return expenses
    .filter(e => e.isFixed)
    .reduce((sum, e) => sum + e.averageAmount, 0);
}

// 後方互換エイリアス
export const detectRecurringExpenses = aggregateRecurringCandidates;
