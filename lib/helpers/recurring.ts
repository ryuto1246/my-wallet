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
  isFixed: boolean;            // 固定費かどうか（金額のゆれが小さい）
  variance: number;            // 金額の分散率（0=完全固定）
}

/**
 * 取引リストから固定費・定期支出を検出
 */
export function detectRecurringExpenses(
  transactions: Array<{
    date: Date;
    description: string;
    amount: number;
    isIncome: boolean;
    category: { main: string; sub: string };
  }>,
  minMonths = 2  // 何ヶ月以上出現したら固定費とみなすか
): RecurringExpense[] {
  // 支出のみを対象
  const expenses = transactions.filter(t => !t.isIncome && t.amount > 0);

  // 説明文で集約
  type GroupEntry = { amounts: number[]; months: Set<string>; category: { main: string; sub: string } };
  const grouped = new Map<string, GroupEntry>();

  expenses.forEach(t => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const key = t.description.trim();

    if (!grouped.has(key)) {
      grouped.set(key, { amounts: [], months: new Set(), category: t.category });
    }
    const entry = grouped.get(key)!;
    entry.amounts.push(t.amount);
    entry.months.add(monthKey);
    if (!entry.category.main) entry.category = t.category;
  });

  const results: RecurringExpense[] = [];

  grouped.forEach((entry, description) => {
    if (entry.months.size < minMonths) return;

    const amounts = entry.amounts;
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = avg > 0
      ? Math.sqrt(amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / amounts.length) / avg
      : 0;

    results.push({
      description,
      category: entry.category,
      amounts,
      averageAmount: Math.round(avg),
      frequency: amounts.length / entry.months.size,
      months: Array.from(entry.months).sort(),
      isFixed: variance < 0.05,  // 5%以内のゆれは固定費
      variance,
    });
  });

  // 平均金額が高い順にソート
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
