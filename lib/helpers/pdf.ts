/**
 * 親立替請求書関連のユーティリティ関数
 */

/**
 * 親立替請求書のLINE貼り付け用テキストを生成
 * @param transactions 親立替を含む取引一覧
 * @param year 年
 * @param month 月（0-11）
 */
export function generateParentAdvanceLineText(
  transactions: Array<{
    date: Date;
    description: string;
    amount: number;
    advanceAmount: number;
    memo?: string;
  }>,
  year: number,
  month: number
): string {
  const monthLabel = `${month + 1}月`;
  const totalAmount = transactions.reduce((sum, tx) => sum + tx.advanceAmount, 0);

  const lines: string[] = [];

  lines.push(`【${year}年${monthLabel} 親立替請求書】`);
  lines.push('');
  lines.push('いつもお世話になっております。');
  lines.push('今月分の親立替費用のご請求です。');
  lines.push('ご確認のほど、よろしくお願いいたします。');
  lines.push('');
  lines.push('─────────────────');

  transactions.forEach((tx) => {
    const date = `${month + 1}/${tx.date.getDate()}`;
    const amount = `¥${tx.advanceAmount.toLocaleString('ja-JP')}`;
    const memo = tx.memo ? `（${tx.memo}）` : '';
    lines.push(`${date}　${tx.description}　${amount}${memo}`);
  });

  lines.push('─────────────────');
  lines.push(`合計：¥${totalAmount.toLocaleString('ja-JP')}`);
  lines.push('');
  lines.push('いつもご支援いただき、誠にありがとうございます。');
  lines.push('今後とも変わらぬご理解とご協力をいただけますよう、');
  lines.push('お願い申し上げます。');

  return lines.join('\n');
}

/**
 * 指定月の親立替取引を抽出
 */
export function filterParentAdvanceTransactions(
  transactions: Array<{
    date: Date;
    advance?: {
      type: string | null;
      advanceAmount: number;
      memo?: string;
    };
    description: string;
    amount: number;
  }>,
  year: number,
  month: number
): Array<{
  date: Date;
  description: string;
  amount: number;
  advanceAmount: number;
  memo?: string;
}> {
  return transactions
    .filter((tx) => {
      const txDate = new Date(tx.date);
      return (
        txDate.getFullYear() === year &&
        txDate.getMonth() === month &&
        tx.advance?.type === 'parent' &&
        tx.advance.advanceAmount > 0
      );
    })
    .map((tx) => ({
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      advanceAmount: tx.advance!.advanceAmount,
      memo: tx.advance?.memo,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
