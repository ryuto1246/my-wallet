/**
 * トランザクション状態管理（Zustand）
 */

import { create } from 'zustand';
import { Transaction, TransactionFilter } from '@/types/transaction';
import { QueryDocumentSnapshot } from 'firebase/firestore';

interface TransactionState {
  transactions: Transaction[];
  filter: TransactionFilter;
  loading: boolean;
  currentPage: number;
  lastDoc: QueryDocumentSnapshot | null;
  pageHistory: (QueryDocumentSnapshot | null)[];
  hasMore: boolean;
  setTransactions: (transactions: Transaction[]) => void;
  appendTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  setFilter: (filter: TransactionFilter) => void;
  setLoading: (loading: boolean) => void;
  setCurrentPage: (page: number) => void;
  setLastDoc: (lastDoc: QueryDocumentSnapshot | null) => void;
  setPageHistory: (history: (QueryDocumentSnapshot | null)[]) => void;
  setHasMore: (hasMore: boolean) => void;
  resetPagination: () => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  filter: {},
  loading: false,
  currentPage: 1,
  lastDoc: null,
  pageHistory: [null],
  hasMore: true,
  
  setTransactions: (transactions) => set({ transactions }),
  
  appendTransactions: (transactions) => set((state) => ({
    transactions: [...state.transactions, ...transactions],
  })),
  
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
  
  setCurrentPage: (page) => set({ currentPage: page }),
  
  setLastDoc: (lastDoc) => set({ lastDoc }),
  
  setPageHistory: (history) => set({ pageHistory: history }),
  
  setHasMore: (hasMore) => set({ hasMore }),
  
  resetPagination: () => set({ 
    currentPage: 1, 
    lastDoc: null, 
    pageHistory: [null], 
    hasMore: true 
  }),
}));

