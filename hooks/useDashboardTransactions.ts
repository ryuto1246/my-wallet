/**
 * ダッシュボード用トランザクション取得カスタムフック
 * 統計・グラフ表示のために全データを取得
 */

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { getAllTransactions } from '@/lib/firebase/transactions';
import { Transaction, TransactionFilter } from '@/types/transaction';

export const useDashboardTransactions = (filter?: TransactionFilter) => {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 全トランザクションを取得
  const fetchAllTransactions = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const allTransactions = await getAllTransactions(user.id, filter);
      setTransactions(allTransactions);
    } catch (error) {
      console.error('全トランザクション取得エラー:', error);
    } finally {
      setLoading(false);
    }
  }, [user, filter]);
  
  // 初回マウント時に取得
  useEffect(() => {
    fetchAllTransactions();
  }, [fetchAllTransactions]);
  
  return {
    transactions,
    loading,
    refetch: fetchAllTransactions,
  };
};

