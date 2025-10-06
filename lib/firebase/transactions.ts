/**
 * Firestore トランザクション関連のヘルパー関数
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  serverTimestamp,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import { Transaction, TransactionFormData, TransactionFilter } from '@/types/transaction';

/**
 * Firestoreのタイムスタンプを日付に変換
 */
const timestampToDate = (timestamp: Timestamp | Date | string | number): Date => {
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

/**
 * トランザクションを作成
 */
export const createTransaction = async (
  userId: string,
  data: TransactionFormData
): Promise<string> => {
  try {
    const transactionsRef = collection(db, 'transactions');
    
    const docRef = await addDoc(transactionsRef, {
      userId,
      date: Timestamp.fromDate(data.date),
      amount: data.amount,
      category: data.category,
      description: data.description,
      paymentMethod: data.paymentMethod,
      isIncome: data.isIncome,
      advance: data.advance || null,
      calendar: data.calendarEventId ? { eventId: data.calendarEventId } : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('トランザクション作成エラー:', error);
    throw error;
  }
};

/**
 * トランザクションを取得
 */
export const getTransaction = async (transactionId: string): Promise<Transaction | null> => {
  try {
    const transactionRef = doc(db, 'transactions', transactionId);
    const transactionSnap = await getDoc(transactionRef);
    
    if (transactionSnap.exists()) {
      const data = transactionSnap.data();
      return {
        id: transactionSnap.id,
        userId: data.userId,
        date: timestampToDate(data.date),
        amount: data.amount,
        category: data.category,
        description: data.description,
        paymentMethod: data.paymentMethod,
        isIncome: data.isIncome,
        advance: data.advance,
        calendar: data.calendar,
        ai: data.ai,
        imageUrl: data.imageUrl,
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
      } as Transaction;
    }
    
    return null;
  } catch (error) {
    console.error('トランザクション取得エラー:', error);
    throw error;
  }
};

/**
 * トランザクション一覧を取得
 */
export const getTransactions = async (
  userId: string,
  filter?: TransactionFilter,
  limitCount: number = 50,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ transactions: Transaction[]; lastDoc: QueryDocumentSnapshot | null }> => {
  try {
    const transactionsRef = collection(db, 'transactions');
    
    let q = query(
      transactionsRef,
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    
    // フィルター適用
    if (filter?.startDate) {
      q = query(q, where('date', '>=', Timestamp.fromDate(filter.startDate)));
    }
    if (filter?.endDate) {
      q = query(q, where('date', '<=', Timestamp.fromDate(filter.endDate)));
    }
    if (filter?.categoryMain) {
      q = query(q, where('category.main', '==', filter.categoryMain));
    }
    if (filter?.isIncome !== undefined) {
      q = query(q, where('isIncome', '==', filter.isIncome));
    }
    
    // ページネーション
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    q = query(q, limit(limitCount));
    
    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        userId: data.userId,
        date: timestampToDate(data.date),
        amount: data.amount,
        category: data.category,
        description: data.description,
        paymentMethod: data.paymentMethod,
        isIncome: data.isIncome,
        advance: data.advance,
        calendar: data.calendar,
        ai: data.ai,
        imageUrl: data.imageUrl,
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
      } as Transaction);
    });
    
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
    
    return { transactions, lastDoc: lastVisible };
  } catch (error) {
    console.error('トランザクション一覧取得エラー:', error);
    throw error;
  }
};

/**
 * トランザクションを更新
 */
export const updateTransaction = async (
  transactionId: string,
  data: Partial<TransactionFormData>
): Promise<void> => {
  try {
    const transactionRef = doc(db, 'transactions', transactionId);
    
    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (data.date) {
      updateData.date = Timestamp.fromDate(data.date);
    }
    if (data.amount !== undefined) {
      updateData.amount = data.amount;
    }
    if (data.category) {
      updateData.category = data.category;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.paymentMethod !== undefined) {
      updateData.paymentMethod = data.paymentMethod;
    }
    if (data.isIncome !== undefined) {
      updateData.isIncome = data.isIncome;
    }
    if (data.advance !== undefined) {
      updateData.advance = data.advance;
    }
    if (data.calendarEventId !== undefined) {
      updateData.calendar = { eventId: data.calendarEventId };
    }
    
    await updateDoc(transactionRef, updateData);
  } catch (error) {
    console.error('トランザクション更新エラー:', error);
    throw error;
  }
};

/**
 * トランザクションを削除
 */
export const deleteTransaction = async (transactionId: string): Promise<void> => {
  try {
    const transactionRef = doc(db, 'transactions', transactionId);
    await deleteDoc(transactionRef);
  } catch (error) {
    console.error('トランザクション削除エラー:', error);
    throw error;
  }
};

