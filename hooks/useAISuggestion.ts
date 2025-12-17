/**
 * AIサジェスチョン用カスタムフック
 */

import { useState, useCallback } from 'react';
import { getAISuggestion, getMultipleAISuggestions, isGeminiAvailable, SuggestionContext, AISuggestion } from '@/lib/gemini';
import { buildPriorHints } from '@/lib/ai/personalization';
import { useAuth } from './useAuth';
// no-op

export const useAISuggestion = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  /**
   * AIサジェスチョンを取得
   */
  const getSuggestion = useCallback(
    async (inputText: string, context?: SuggestionContext) => {
      if (!inputText.trim()) {
        setSuggestion(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (!isGeminiAvailable()) {
          setError('Gemini APIが設定されていません');
          setIsLoading(false);
          return;
        }

        // 履歴ヒントを生成してLLMに注入（RAG）
        const priorHints = await buildPriorHints({
          userId: user?.id,
          inputText,
        });

        const aiSuggestion = await getAISuggestion(inputText, {
          ...context,
          userId: user?.id,
          priorHints,
          timeOfDay: getTimeOfDay(),
          dayOfWeek: getDayOfWeek(),
        });

        setSuggestion(aiSuggestion);
      } catch (err: unknown) {
        const e = err as { message?: string; status?: number; code?: number; originalError?: unknown };
        console.error('Error getting AI suggestion:', e);
        console.error('Error details:', {
          message: e.message,
          status: e.status,
          code: e.code,
          originalError: e.originalError,
        });
        
        // レートリミットエラーの検出（拡張版）
        const errorMessage = e.message || '';
        const errorStatusNum =
          typeof e.status === 'number'
            ? e.status
            : typeof e.code === 'number'
            ? e.code
            : undefined;
        
        if (
          errorMessage === 'RATE_LIMIT_EXCEEDED' ||
          errorStatusNum === 429 ||
          errorMessage.includes('quota') ||
          errorMessage.includes('Quota exceeded') ||
          errorMessage.includes('Quota') ||
          errorMessage.includes('rate limit') ||
          errorMessage.includes('Rate limit') ||
          errorMessage.includes('RESOURCE_EXHAUSTED') ||
          (typeof errorStatusNum === 'number' && errorStatusNum >= 429 && errorStatusNum < 500)
        ) {
          setQuotaExceeded(true);
          setError('本日のAIサジェスチョン回数が上限に達しました。しばらく時間をおいてから再度お試しください。');
        } else if (
          errorMessage === 'API_KEY_INVALID' ||
          errorMessage.includes('API key') ||
          errorMessage.includes('API_KEY') ||
          errorMessage.includes('PERMISSION_DENIED')
        ) {
          setError('AI APIキーが設定されていないか、無効です。設定を確認してください。');
        } else {
          setError(`AIサジェスチョンの取得に失敗しました: ${errorMessage || '不明なエラー'}`);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  /**
   * 複数のAIサジェスチョンを取得
   */
  const getMultipleSuggestions = useCallback(
    async (inputText: string, context?: SuggestionContext) => {
      if (!inputText.trim()) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (!isGeminiAvailable()) {
          setError('Gemini APIが設定されていません');
          setIsLoading(false);
          return;
        }

        // 履歴ヒントを生成してLLMに注入（RAG）
        const priorHints = await buildPriorHints({
          userId: user?.id,
          inputText,
        });

        const aiSuggestions = await getMultipleAISuggestions(inputText, {
          ...context,
          userId: user?.id,
          priorHints,
          timeOfDay: getTimeOfDay(),
          dayOfWeek: getDayOfWeek(),
        });

        setSuggestions(aiSuggestions);
      } catch (err: unknown) {
        const e = err as { message?: string; status?: number; code?: number; originalError?: unknown };
        console.error('Error getting multiple AI suggestions:', e);
        console.error('Error details:', {
          message: e.message,
          status: e.status,
          code: e.code,
          originalError: e.originalError,
        });
        
        // レートリミットエラーの検出（拡張版）
        const errorMessage = e.message || '';
        const errorStatusNum =
          typeof e.status === 'number'
            ? e.status
            : typeof e.code === 'number'
            ? e.code
            : undefined;
        
        if (
          errorMessage === 'RATE_LIMIT_EXCEEDED' ||
          errorStatusNum === 429 ||
          errorMessage.includes('quota') ||
          errorMessage.includes('Quota exceeded') ||
          errorMessage.includes('Quota') ||
          errorMessage.includes('rate limit') ||
          errorMessage.includes('Rate limit') ||
          errorMessage.includes('RESOURCE_EXHAUSTED') ||
          (typeof errorStatusNum === 'number' && errorStatusNum >= 429 && errorStatusNum < 500)
        ) {
          setQuotaExceeded(true);
          setError('本日のAIサジェスチョン回数が上限に達しました。しばらく時間をおいてから再度お試しください。');
        } else if (
          errorMessage === 'API_KEY_INVALID' ||
          errorMessage.includes('API key') ||
          errorMessage.includes('API_KEY') ||
          errorMessage.includes('PERMISSION_DENIED')
        ) {
          setError('AI APIキーが設定されていないか、無効です。設定を確認してください。');
        } else {
          setError(`AIサジェスチョンの取得に失敗しました: ${errorMessage || '不明なエラー'}`);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  /**
   * サジェスチョンをクリア
   */
  const clearSuggestion = useCallback(() => {
    setSuggestion(null);
    setSuggestions([]);
    setError(null);
    setQuotaExceeded(false);
  }, []);

  /**
   * AIサジェスチョンが利用可能か
   */
  const isAvailable = isGeminiAvailable();

  return {
    suggestion,
    suggestions,
    isLoading,
    error,
    quotaExceeded,
    getSuggestion,
    getMultipleSuggestions,
    clearSuggestion,
    isAvailable,
  };
};

/**
 * 現在の時間帯を取得
 */
const getTimeOfDay = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

/**
 * 現在の曜日を取得
 */
const getDayOfWeek = (): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
};

