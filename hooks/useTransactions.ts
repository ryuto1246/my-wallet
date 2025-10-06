/**
 * トランザクション操作カスタムフック
 */

import { useCallback, useEffect } from 'react';
import { useTransactionStore } from '@/lib/store/transactionStore';
import { useAuthStore } from '@/lib/store/authStore';
import {
  getTransactions,
  createTransaction,
  updateTransaction as updateTransactionFirestore,
  deleteTransaction as deleteTransactionFirestore,
} from '@/lib/firebase/transactions';
import { TransactionFormData, TransactionFilter } from '@/types/transaction';

export const useTransactions = (filter?: TransactionFilter) => {
  const { user } = useAuthStore();
  const {
    transactions,
    filter: currentFilter,
    loading,
    setTransactions,
    addTransaction,
    updateTransaction: updateTransactionStore,
    deleteTransaction: deleteTransactionStore,
    setFilter,
    setLoading,
  } = useTransactionStore();
  
  // トランザクション一覧を取得
  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { transactions } = await getTransactions(user.id, currentFilter);
      setTransactions(transactions);
    } catch (error) {
      console.error('トランザクション取得エラー:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentFilter, setTransactions, setLoading]);
  
  // 初回マウント時とフィルター変更時に取得
  useEffect(() => {
    if (filter) {
      setFilter(filter);
    }
  }, [filter, setFilter]);
  
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);
  
  // トランザクションを作成
  const create = useCallback(async (data: TransactionFormData) => {
    if (!user) return;
    
    try {
      const id = await createTransaction(user.id, data);
      addTransaction({
        id,
        userId: user.id,
        date: data.date,
        amount: data.amount,
        category: data.category,
        description: data.description,
        paymentMethod: data.paymentMethod,
        isIncome: data.isIncome,
        advance: data.advance as any,
        calendar: data.calendarEventId ? { eventId: data.calendarEventId, eventName: '', eventType: 'during' as const } : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return id;
    } catch (error) {
      console.error('トランザクション作成エラー:', error);
      throw error;
    }
  }, [user, addTransaction]);
  
  // トランザクションを更新
  const update = useCallback(async (id: string, data: Partial<TransactionFormData>) => {
    try {
      await updateTransactionFirestore(id, data);
      updateTransactionStore(id, { ...data as any, updatedAt: new Date() });
    } catch (error) {
      console.error('トランザクション更新エラー:', error);
      throw error;
    }
  }, [updateTransactionStore]);
  
  // トランザクションを削除
  const deleteTransaction = useCallback(async (id: string) => {
    try {
      await deleteTransactionFirestore(id);
      deleteTransactionStore(id);
    } catch (error) {
      console.error('トランザクション削除エラー:', error);
      throw error;
    }
  }, [deleteTransactionStore]);
  
  return {
    transactions,
    loading,
    fetchTransactions,
    createTransaction: create,
    updateTransaction: update,
    deleteTransaction,
  };
};

