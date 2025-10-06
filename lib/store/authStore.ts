/**
 * 認証状態管理（Zustand）
 */

import { create } from 'zustand';
import { User } from '@/types/user';
import { User as FirebaseUser } from 'firebase/auth';
import { getUserDocument, createUserDocument } from '@/lib/firebase/users';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  setFirebaseUser: (firebaseUser: FirebaseUser | null) => Promise<void>;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  firebaseUser: null,
  loading: true,
  
  setFirebaseUser: async (firebaseUser) => {
    if (firebaseUser) {
      // Firestoreからユーザー情報を取得
      let user = await getUserDocument(firebaseUser.uid);
      
      // ユーザードキュメントが存在しない場合は作成
      if (!user) {
        await createUserDocument(
          firebaseUser.uid,
          firebaseUser.email || '',
          firebaseUser.displayName || 'ユーザー'
        );
        user = await getUserDocument(firebaseUser.uid);
      }
      
      set({ firebaseUser, user, loading: false });
    } else {
      set({ firebaseUser: null, user: null, loading: false });
    }
  },
  
  setLoading: (loading) => set({ loading }),
  
  clearUser: () => set({ user: null, firebaseUser: null, loading: false }),
}));

