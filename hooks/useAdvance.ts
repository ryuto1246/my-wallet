/**
 * 立替金管理のカスタムフック
 */

import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { calculateAdvanceBalance, getUnrecoveredAdvances } from '@/lib/helpers/advance';
import { Transaction } from '@/types/transaction';

export function useAdvance() {
  const { transactions } = useTransactions();

  // 立替金残高を計算
  const balance = useMemo(() => {
    if (transactions.length === 0) {
      return {
        userId: '',
        totalAdvanced: 0,
        totalRecovered: 0,
        remaining: 0,
        updatedAt: new Date(),
      };
    }
    return calculateAdvanceBalance(transactions);
  }, [transactions]);

  // 未回収の立替一覧
  const unrecoveredAdvances = useMemo(() => {
    return getUnrecoveredAdvances(transactions);
  }, [transactions]);

  // 立替を含むトランザクション一覧
  const advanceTransactions = useMemo(() => {
    return transactions.filter((t) => t.advance !== undefined);
  }, [transactions]);

  return {
    balance,
    unrecoveredAdvances,
    advanceTransactions,
    hasUnrecovered: unrecoveredAdvances.length > 0,
  };
}

