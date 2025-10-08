/**
 * 立替関連のヘルパー関数
 */

import { Transaction } from '@/types/transaction';
import { AdvanceInfo, AdvanceBalance } from '@/types/advance';
import { isTransferTransaction } from './transaction';

/**
 * 立替金残高を計算
 */
export function calculateAdvanceBalance(transactions: Transaction[]): AdvanceBalance {
  const advances = transactions.filter(
    (t) => t.advance && !t.isIncome && !isTransferTransaction(t)
  );

  const totalAdvanced = advances.reduce((sum, t) => {
    return sum + (t.advance?.advanceAmount || 0);
  }, 0);

  // 立替金回収の収入を集計
  const recoveries = transactions.filter(
    (t) => t.isIncome && t.category.sub === '立替金回収'
  );

  const totalRecovered = recoveries.reduce((sum, t) => sum + t.amount, 0);

  const remaining = totalAdvanced - totalRecovered;

  return {
    userId: transactions[0]?.userId || '',
    totalAdvanced,
    totalRecovered,
    remaining,
    updatedAt: new Date(),
  };
}

/**
 * 立替を除外した金額を計算
 * 
 * 友人立替・親負担: 立替金額のみ除外、自己負担額はカウント
 */
export function getActualExpenseAmount(transaction: Transaction): number {
  if (transaction.isIncome || isTransferTransaction(transaction)) {
    return 0;
  }

  if (!transaction.advance) {
    return transaction.amount;
  }

  const { personalAmount } = transaction.advance;

  // personalAmountが未定義の場合は全額を返す（古いデータ対応）
  if (personalAmount === undefined) {
    return transaction.amount;
  }

  // 友人立替・親負担どちらも自己負担額のみカウント
  return personalAmount;
}

/**
 * トランザクションリストから実際の支出総額を計算
 */
export function calculateActualExpense(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => {
    return sum + getActualExpenseAmount(t);
  }, 0);
}

/**
 * 立替情報のバリデーション
 */
export function validateAdvanceInfo(advance: AdvanceInfo): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!advance.type) {
    errors.push('立替タイプを選択してください');
  }

  if (advance.totalAmount <= 0) {
    errors.push('支払総額は正の数である必要があります');
  }

  if (advance.advanceAmount === undefined || advance.advanceAmount < 0) {
    errors.push('立替金額は0以上である必要があります');
  }

  if (advance.personalAmount === undefined || advance.personalAmount < 0) {
    errors.push('自己負担額は0以上である必要があります');
  }

  // advanceAmountとpersonalAmountが有効な場合のみ合計をチェック
  if (advance.advanceAmount !== undefined && advance.personalAmount !== undefined) {
    const sum = advance.advanceAmount + advance.personalAmount;
    if (Math.abs(sum - advance.totalAmount) > 0.01) {
      errors.push('立替金額と自己負担額の合計が支払総額と一致しません');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 立替情報を含むトランザクションのフォーマット
 */
export function formatAdvanceInfo(advance: AdvanceInfo): string {
  const typeLabel = advance.type === 'friend' ? '友人立替' : '親負担';
  const parts = [typeLabel];

  // advanceAmountとpersonalAmountが有効な場合のみ追加
  if (advance.advanceAmount !== undefined && advance.personalAmount !== undefined) {
    parts.push(
      `立替: ¥${advance.advanceAmount.toLocaleString()}`,
      `自己: ¥${advance.personalAmount.toLocaleString()}`
    );
  }

  if (advance.memo) {
    parts.push(`(${advance.memo})`);
  }

  return parts.join(' ');
}

/**
 * 未回収の立替トランザクションを取得
 */
export function getUnrecoveredAdvances(transactions: Transaction[]): Transaction[] {
  return transactions.filter(
    (t) => t.advance && !t.advance.isRecovered && !t.isIncome && !isTransferTransaction(t)
  );
}

/**
 * 立替金回収を記録
 */
export function markAdvanceAsRecovered(
  transaction: Transaction
): Transaction {
  if (!transaction.advance) {
    throw new Error('このトランザクションは立替ではありません');
  }

  return {
    ...transaction,
    advance: {
      ...transaction.advance,
      isRecovered: true,
    },
  };
}

