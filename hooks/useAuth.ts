/**
 * 認証カスタムフック
 */

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { onAuthStateChange } from '@/lib/firebase/auth';

export const useAuth = () => {
  const { user, firebaseUser, loading, setFirebaseUser, setLoading } = useAuthStore();
  
  useEffect(() => {
    setLoading(true);
    
    // 認証状態の変更を監視
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      await setFirebaseUser(firebaseUser);
    });
    
    return () => unsubscribe();
  }, [setFirebaseUser, setLoading]);
  
  return {
    user,
    firebaseUser,
    loading,
    isAuthenticated: !!user,
  };
};

