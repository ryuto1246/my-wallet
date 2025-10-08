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
    currentPage,
    lastDoc,
    pageHistory,
    hasMore,
    setTransactions,
    appendTransactions,
    addTransaction,
    updateTransaction: updateTransactionStore,
    deleteTransaction: deleteTransactionStore,
    setFilter,
    setLoading,
    setCurrentPage,
    setLastDoc,
    setPageHistory,
    setHasMore,
    resetPagination,
  } = useTransactionStore();
  
  // トランザクション一覧を取得（初回）
  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    resetPagination();
    try {
      const { transactions, lastDoc: newLastDoc } = await getTransactions(user.id, currentFilter, 50);
      setTransactions(transactions);
      setLastDoc(newLastDoc);
      setPageHistory([null, newLastDoc]);
      setHasMore(transactions.length === 50);
      setCurrentPage(1);
    } catch (error) {
      console.error('トランザクション取得エラー:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentFilter, setTransactions, setLoading, setLastDoc, setPageHistory, setHasMore, setCurrentPage, resetPagination]);
  
  // 追加のトランザクションを読み込み（ページネーション）
  const loadMore = useCallback(async () => {
    if (!user || !lastDoc || !hasMore || loading) return;
    
    setLoading(true);
    try {
      const { transactions: newTransactions, lastDoc: newLastDoc } = await getTransactions(
        user.id,
        currentFilter,
        50,
        lastDoc
      );
      appendTransactions(newTransactions);
      setLastDoc(newLastDoc);
      setHasMore(newTransactions.length === 50);
    } catch (error) {
      console.error('追加トランザクション取得エラー:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentFilter, lastDoc, hasMore, loading, appendTransactions, setLoading, setLastDoc, setHasMore]);
  
  // 次のページへ
  const nextPage = useCallback(async () => {
    if (!user || !hasMore || loading) return;
    
    setLoading(true);
    try {
      const startDoc = pageHistory[currentPage] || undefined;
      const { transactions: newTransactions, lastDoc: newLastDoc } = await getTransactions(
        user.id,
        currentFilter,
        50,
        startDoc
      );
      setTransactions(newTransactions);
      setLastDoc(newLastDoc);
      
      // ページ履歴を更新
      const newHistory = [...pageHistory];
      if (newHistory.length <= currentPage + 1) {
        newHistory.push(newLastDoc);
      }
      setPageHistory(newHistory);
      
      setHasMore(newTransactions.length === 50);
      setCurrentPage(currentPage + 1);
    } catch (error) {
      console.error('次のページ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentFilter, currentPage, pageHistory, hasMore, loading, setTransactions, setLoading, setLastDoc, setPageHistory, setHasMore, setCurrentPage]);
  
  // 前のページへ
  const previousPage = useCallback(async () => {
    if (!user || currentPage <= 1 || loading) return;
    
    setLoading(true);
    try {
      const startDoc = pageHistory[currentPage - 2] || undefined;
      const { transactions: newTransactions, lastDoc: newLastDoc } = await getTransactions(
        user.id,
        currentFilter,
        50,
        startDoc
      );
      setTransactions(newTransactions);
      setLastDoc(newLastDoc);
      setCurrentPage(currentPage - 1);
      // hasMoreは前のページに戻る場合は常にtrue（次のページが存在する）
      setHasMore(true);
    } catch (error) {
      console.error('前のページ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentFilter, currentPage, pageHistory, loading, setTransactions, setLoading, setLastDoc, setCurrentPage, setHasMore]);
  
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
        advance: data.advance ? {
          type: data.advance.type || null,
          totalAmount: data.advance.totalAmount || 0,
          advanceAmount: data.advance.advanceAmount || 0,
          personalAmount: data.advance.personalAmount || 0,
          isRecovered: data.advance.isRecovered || false,
        } : undefined,
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
      updateTransactionStore(id, {
        date: data.date,
        amount: data.amount,
        category: data.category,
        description: data.description,
        paymentMethod: data.paymentMethod,
        isIncome: data.isIncome,
        updatedAt: new Date()
      });
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
    currentPage,
    hasMore,
    hasPrevious: currentPage > 1,
    fetchTransactions,
    loadMore,
    nextPage,
    previousPage,
    createTransaction: create,
    updateTransaction: update,
    deleteTransaction,
  };
};

