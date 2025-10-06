/**
 * トランザクション状態管理（Zustand）
 */

import { create } from 'zustand';
import { Transaction, TransactionFilter } from '@/types/transaction';

interface TransactionState {
  transactions: Transaction[];
  filter: TransactionFilter;
  loading: boolean;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  setFilter: (filter: TransactionFilter) => void;
  setLoading: (loading: boolean) => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  filter: {},
  loading: false,
  
  setTransactions: (transactions) => set({ transactions }),
  
  addTransaction: (transaction) => set((state) => ({
    transactions: [transaction, ...state.transactions],
  })),
  
  updateTransaction: (id, updatedData) => set((state) => ({
    transactions: state.transactions.map((t) =>
      t.id === id ? { ...t, ...updatedData } : t
    ),
  })),
  
  deleteTransaction: (id) => set((state) => ({
    transactions: state.transactions.filter((t) => t.id !== id),
  })),
  
  setFilter: (filter) => set({ filter }),
  
  setLoading: (loading) => set({ loading }),
}));

