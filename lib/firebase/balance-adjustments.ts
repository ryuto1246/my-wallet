/**
 * Firestore: 残高調整関連
 */

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { BalanceAdjustment, BalanceAdjustmentInput } from '@/types';

const COLLECTION_NAME = 'balanceAdjustments';

/**
 * 残高調整を作成
 */
export async function createBalanceAdjustment(
  userId: string,
  data: BalanceAdjustmentInput,
  expectedBalance: number
): Promise<string> {
  try {
    const adjustmentData = {
      userId,
      date: Timestamp.fromDate(data.date),
      paymentMethod: data.paymentMethod,
      expectedBalance,
      actualBalance: data.actualBalance,
      difference: data.actualBalance - expectedBalance,
      memo: data.memo || '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    console.log('Creating balance adjustment:', adjustmentData);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), adjustmentData);
    console.log('Balance adjustment created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating balance adjustment:', error);
    throw error;
  }
}

/**
 * ユーザーの残高調整を取得
 */
export async function getBalanceAdjustments(
  userId: string
): Promise<BalanceAdjustment[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      date: data.date.toDate(),
      paymentMethod: data.paymentMethod,
      expectedBalance: data.expectedBalance,
      actualBalance: data.actualBalance,
      difference: data.difference,
      memo: data.memo,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : undefined,
    } as BalanceAdjustment;
  });
}

/**
 * 決済手段ごとの残高調整を取得
 */
export async function getBalanceAdjustmentsByPaymentMethod(
  userId: string,
  paymentMethod: string
): Promise<BalanceAdjustment[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    where('paymentMethod', '==', paymentMethod),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      date: data.date.toDate(),
      paymentMethod: data.paymentMethod,
      expectedBalance: data.expectedBalance,
      actualBalance: data.actualBalance,
      difference: data.difference,
      memo: data.memo,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : undefined,
    } as BalanceAdjustment;
  });
}

/**
 * 残高調整を更新
 */
export async function updateBalanceAdjustment(
  id: string,
  data: Partial<BalanceAdjustmentInput>,
  expectedBalance?: number
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const updateData: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
  };

  if (data.date) updateData.date = Timestamp.fromDate(data.date);
  if (data.paymentMethod) updateData.paymentMethod = data.paymentMethod;
  if (data.actualBalance !== undefined) {
    updateData.actualBalance = data.actualBalance;
    if (expectedBalance !== undefined) {
      updateData.difference = data.actualBalance - expectedBalance;
    }
  }
  if (expectedBalance !== undefined) updateData.expectedBalance = expectedBalance;
  if (data.memo !== undefined) updateData.memo = data.memo;

  await updateDoc(docRef, updateData);
}

/**
 * 残高調整を削除
 */
export async function deleteBalanceAdjustment(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
}

