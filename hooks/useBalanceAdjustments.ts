/**
 * 残高調整を管理するカスタムフック
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getBalanceAdjustments } from '@/lib/firebase';
import { BalanceAdjustment } from '@/types';

export function useBalanceAdjustments() {
  const { user } = useAuth();
  const [adjustments, setAdjustments] = useState<BalanceAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setAdjustments([]);
      setLoading(false);
      return;
    }

    const fetchAdjustments = async () => {
      try {
        setLoading(true);
        const data = await getBalanceAdjustments(user.id);
        console.log('✅ Fetched balance adjustments:', data);
        setAdjustments(data);
        setError(null);
      } catch (err) {
        console.error('❌ Failed to fetch balance adjustments:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdjustments();
  }, [user?.id]);

  return {
    adjustments,
    loading,
    error,
  };
}

