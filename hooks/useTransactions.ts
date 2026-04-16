/**
 * トランザクション操作カスタムフック
 */

import { useCallback, useEffect, useRef } from 'react';
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
      const { transactions, lastDoc: newLastDoc } = await getTransactions(user.id, currentFilter, 20);
      setTransactions(transactions);
      setLastDoc(newLastDoc);
      setPageHistory([null, newLastDoc]);
      setHasMore(transactions.length === 20);
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
        20,
        lastDoc
      );
      appendTransactions(newTransactions);
      setLastDoc(newLastDoc);
      setHasMore(newTransactions.length === 20);
    } catch (error) {
      console.error('追加トランザクション取得エラー:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentFilter, lastDoc, hasMore, loading, appendTransactions, setLoading, setLastDoc, setHasMore]);
  
  // 次のページへ
  const nextPage = useCallback(async () => {
    if (!user || !hasMore || loading || !lastDoc) return;
    
    setLoading(true);
    try {
      // 現在のページのlastDocを使用して次のページを取得
      const { transactions: newTransactions, lastDoc: newLastDoc } = await getTransactions(
        user.id,
        currentFilter,
        20,
        lastDoc
      );
      setTransactions(newTransactions);
      setLastDoc(newLastDoc);
      
      // ページ履歴を更新（現在のページのlastDocを履歴に保存）
      const newHistory = [...pageHistory];
      if (newHistory.length <= currentPage) {
        newHistory.push(lastDoc);
      }
      // 次のページのlastDocを履歴に追加
      if (newHistory.length <= currentPage + 1) {
        newHistory.push(newLastDoc);
      }
      setPageHistory(newHistory);
      
      setHasMore(newTransactions.length === 20);
      setCurrentPage(currentPage + 1);
    } catch (error) {
      console.error('次のページ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentFilter, currentPage, pageHistory, lastDoc, hasMore, loading, setTransactions, setLoading, setLastDoc, setPageHistory, setHasMore, setCurrentPage]);
  
  // 前のページへ
  const previousPage = useCallback(async () => {
    if (!user || currentPage <= 1 || loading) return;
    
    setLoading(true);
    try {
      // 前のページの開始位置を取得（pageHistory[currentPage - 1]は前のページの終了位置）
      // 前のページの開始位置はpageHistory[currentPage - 2]
      const startDoc = pageHistory[currentPage - 2] || undefined;
      const { transactions: newTransactions, lastDoc: newLastDoc } = await getTransactions(
        user.id,
        currentFilter,
        20,
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
  
  // フィルターを設定
  useEffect(() => {
    if (filter) {
      setFilter(filter);
    }
  }, [filter, setFilter]);
  
  // 初回マウント時とフィルター変更時のみデータを取得
  const prevFilterRef = useRef<string>('');
  const isInitialMount = useRef(true);
  const prevUserIdRef = useRef<string | undefined>(undefined);
  
  useEffect(() => {
    if (!user?.id) {
      prevUserIdRef.current = undefined;
      return;
    }
    
    // ユーザーが変更された場合は再取得
    const userIdChanged = prevUserIdRef.current !== user.id;
    if (userIdChanged) {
      prevUserIdRef.current = user.id;
      isInitialMount.current = true;
      prevFilterRef.current = '';
    }
    
    const filterKey = JSON.stringify(currentFilter);
    const isFilterChanged = prevFilterRef.current !== filterKey;
    
    // 初回マウント時またはフィルター変更時のみデータを取得
    if (isInitialMount.current || isFilterChanged) {
      isInitialMount.current = false;
      prevFilterRef.current = filterKey;
      fetchTransactions();
    }
  }, [user?.id, currentFilter, fetchTransactions]);
  
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
        // 振替を即時反映（to 側の合計に反映されるよう transfer を保持）
        transactionType: data.transfer ? 'transfer' : (data.isIncome ? 'income' : 'expense'),
        transfer: data.transfer,
        advance: data.advance ? {
          type: data.advance.type || null,
          totalAmount: data.advance.totalAmount || 0,
          advanceAmount: data.advance.advanceAmount || 0,
          personalAmount: data.advance.personalAmount || 0,
          status: data.advance.status || 'pending',
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
        // 更新時も振替情報をローカルストアに反映
        transactionType: data.transfer ? 'transfer' : (typeof data.isIncome === 'boolean' ? (data.isIncome ? 'income' : 'expense') : undefined),
        transfer: data.transfer,
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

