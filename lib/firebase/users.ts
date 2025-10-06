/**
 * Firestore ユーザー関連のヘルパー関数
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { User, UserSettings } from '@/types/user';
import { PaymentMethod } from '@/types/transaction';

/**
 * ユーザードキュメントを作成
 */
export const createUserDocument = async (
  userId: string,
  email: string,
  displayName: string
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    const defaultSettings: UserSettings = {
      defaultPaymentMethod: PaymentMethod.CASH,
      calendarEnabled: false,
      aiSuggestionEnabled: true,
      currency: 'JPY',
      locale: 'ja-JP',
    };
    
    await setDoc(userRef, {
      email,
      displayName,
      settings: defaultSettings,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('ユーザードキュメント作成エラー:', error);
    throw error;
  }
};

/**
 * ユーザー情報を取得
 */
export const getUserDocument = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        id: userSnap.id,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        settings: data.settings,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as User;
    }
    
    return null;
  } catch (error) {
    console.error('ユーザードキュメント取得エラー:', error);
    throw error;
  }
};

/**
 * ユーザー設定を更新
 */
export const updateUserSettings = async (
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      settings,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('ユーザー設定更新エラー:', error);
    throw error;
  }
};

/**
 * ユーザープロフィールを更新
 */
export const updateUserProfile = async (
  userId: string,
  data: { displayName?: string; photoURL?: string }
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('ユーザープロフィール更新エラー:', error);
    throw error;
  }
};

