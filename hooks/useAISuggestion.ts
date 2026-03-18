/**
 * AIサジェスチョン用カスタムフック
 */

import { useState, useCallback } from 'react';
import { buildPriorHints } from '@/lib/ai/personalization';
import { useAuth } from './useAuth';
import type { AISuggestion, SuggestionContext } from '@/lib/claude/suggestion-types';

export type { AISuggestion, SuggestionContext };

export const useAISuggestion = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const handleError = useCallback((err: unknown) => {
    const e = err as { message?: string; status?: number };
    const msg = e.message || '';
    if (msg === 'RATE_LIMIT_EXCEEDED' || e.status === 429) {
      setQuotaExceeded(true);
      setError('本日のAIサジェスチョン回数が上限に達しました。しばらく時間をおいてから再度お試しください。');
    } else {
      setError(`AIサジェスチョンの取得に失敗しました: ${msg || '不明なエラー'}`);
    }
  }, []);

  const getSuggestion = useCallback(
    async (inputText: string, context?: SuggestionContext) => {
      if (!inputText.trim()) { setSuggestion(null); return; }
      setIsLoading(true);
      setError(null);
      try {
        const priorHints = await buildPriorHints({ userId: user?.id, inputText });
        const res = await fetch('/api/ai/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputText,
            context: { ...context, userId: user?.id, priorHints, timeOfDay: getTimeOfDay(), dayOfWeek: getDayOfWeek() },
          }),
        });
        if (res.status === 429) { handleError({ message: 'RATE_LIMIT_EXCEEDED', status: 429 }); return; }
        if (!res.ok) throw new Error('API error');
        const data: AISuggestion[] = await res.json();
        setSuggestion(data[0] || null);
      } catch (err) {
        handleError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [user, handleError]
  );

  const getMultipleSuggestions = useCallback(
    async (inputText: string, context?: SuggestionContext) => {
      if (!inputText.trim()) { setSuggestions([]); return; }
      setIsLoading(true);
      setError(null);
      try {
        const priorHints = await buildPriorHints({ userId: user?.id, inputText });
        const res = await fetch('/api/ai/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputText,
            context: { ...context, userId: user?.id, priorHints, timeOfDay: getTimeOfDay(), dayOfWeek: getDayOfWeek() },
          }),
        });
        if (res.status === 429) { handleError({ message: 'RATE_LIMIT_EXCEEDED', status: 429 }); return; }
        if (!res.ok) throw new Error('API error');
        const data: AISuggestion[] = await res.json();
        setSuggestions(data);
      } catch (err) {
        handleError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [user, handleError]
  );

  const clearSuggestion = useCallback(() => {
    setSuggestion(null);
    setSuggestions([]);
    setError(null);
    setQuotaExceeded(false);
  }, []);

  return {
    suggestion,
    suggestions,
    isLoading,
    error,
    quotaExceeded,
    getSuggestion,
    getMultipleSuggestions,
    clearSuggestion,
    isAvailable: true,
  };
};

const getTimeOfDay = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

const getDayOfWeek = (): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
};
