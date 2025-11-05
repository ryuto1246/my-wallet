/**
 * 残高調整を管理するカスタムフック
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getBalanceAdjustments } from '@/lib/firebase';
import { BalanceAdjustment } from '@/types';

export function useBalanceAdjustments() {
  const { user } = useAuth();
  const [adjustments, setAdjustments] = useState<BalanceAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAdjustments = useCallback(async () => {
    if (!user?.id) {
      setAdjustments([]);
      setLoading(false);
      return;
    }

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
  }, [user?.id]);

  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);

  return {
    adjustments,
    loading,
    error,
    refetch: fetchAdjustments,
  };
}

