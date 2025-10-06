/**
 * Firebase認証関連のヘルパー関数
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from './config';

/**
 * メールアドレスとパスワードでユーザー登録
 */
export const signUp = async (email: string, password: string, displayName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // ユーザー名を設定
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    return userCredential.user;
  } catch (error) {
    console.error('サインアップエラー:', error);
    throw error;
  }
};

/**
 * メールアドレスとパスワードでログイン
 */
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('サインインエラー:', error);
    throw error;
  }
};

/**
 * Googleアカウントでログイン
 */
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
  } catch (error) {
    console.error('Googleサインインエラー:', error);
    throw error;
  }
};

/**
 * ログアウト
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('サインアウトエラー:', error);
    throw error;
  }
};

/**
 * パスワードリセットメールを送信
 */
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('パスワードリセットエラー:', error);
    throw error;
  }
};

/**
 * 認証状態の変更を監視
 */
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * 現在のユーザーを取得
 */
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

