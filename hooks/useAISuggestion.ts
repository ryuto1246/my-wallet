/**
 * AIサジェスチョン用カスタムフック
 */

import { useState, useCallback } from 'react';
import { getAISuggestion, getMultipleAISuggestions, isGeminiAvailable, SuggestionContext, AISuggestion } from '@/lib/gemini';
import { predictFromHistory } from '@/lib/firebase/ai-learning';
import { useAuth } from './useAuth';
import { CATEGORIES } from '@/constants/categories';

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
        // まず過去の履歴から予測を試みる
        if (user && context) {
          const timeOfDay = getTimeOfDay();
          const dayOfWeek = getDayOfWeek();
          
          const historyPrediction = await predictFromHistory(
            user.id,
            inputText,
            {
              amount: context.amount || 0,
              paymentMethod: context.paymentMethod || 'cash',
              timeOfDay,
              dayOfWeek,
            }
          );

          if (historyPrediction) {
            setSuggestion(historyPrediction);
            setIsLoading(false);
            return;
          }
        }

        // 履歴がない場合はGemini APIで新規サジェスチョン
        if (!isGeminiAvailable()) {
          setError('Gemini APIが設定されていません');
          setIsLoading(false);
          return;
        }

        const aiSuggestion = await getAISuggestion(inputText, {
          ...context,
          timeOfDay: getTimeOfDay(),
          dayOfWeek: getDayOfWeek(),
        });

        setSuggestion(aiSuggestion);
      } catch (err: any) {
        console.error('Error getting AI suggestion:', err);
        console.error('Error details:', {
          message: err.message,
          status: err.status,
          code: err.code,
          originalError: err.originalError,
        });
        
        // レートリミットエラーの検出（拡張版）
        const errorMessage = err.message || '';
        const errorStatus = err.status || err.code;
        
        if (
          errorMessage === 'RATE_LIMIT_EXCEEDED' ||
          errorStatus === 429 ||
          errorMessage.includes('quota') ||
          errorMessage.includes('Quota exceeded') ||
          errorMessage.includes('Quota') ||
          errorMessage.includes('rate limit') ||
          errorMessage.includes('Rate limit') ||
          errorMessage.includes('RESOURCE_EXHAUSTED') ||
          (errorStatus >= 429 && errorStatus < 500)
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
        // まず過去の履歴から予測を試みる
        if (user && context) {
          const timeOfDay = getTimeOfDay();
          const dayOfWeek = getDayOfWeek();
          
          const historyPrediction = await predictFromHistory(
            user.id,
            inputText,
            {
              amount: context.amount || 0,
              paymentMethod: context.paymentMethod || 'cash',
              timeOfDay,
              dayOfWeek,
            }
          );

          if (historyPrediction) {
            // 履歴があれば最初の提案として追加（収入/支出の情報も含める）
            const aiSuggestions = await getMultipleAISuggestions(inputText, {
              ...context,
              timeOfDay: getTimeOfDay(),
              dayOfWeek: getDayOfWeek(),
            });
            
            // 履歴予測にisIncomeプロパティを追加（カテゴリーから判定）
            const categories = CATEGORIES.find(c => c.main === historyPrediction.category.main);
            const predictionWithIncome = {
              ...historyPrediction,
              isIncome: categories?.isIncome || false,
            };
            
            setSuggestions([predictionWithIncome, ...aiSuggestions]);
            setIsLoading(false);
            return;
          }
        }

        // 履歴がない場合はGemini APIで複数提案
        if (!isGeminiAvailable()) {
          setError('Gemini APIが設定されていません');
          setIsLoading(false);
          return;
        }

        const aiSuggestions = await getMultipleAISuggestions(inputText, {
          ...context,
          timeOfDay: getTimeOfDay(),
          dayOfWeek: getDayOfWeek(),
        });

        setSuggestions(aiSuggestions);
      } catch (err: any) {
        console.error('Error getting multiple AI suggestions:', err);
        console.error('Error details:', {
          message: err.message,
          status: err.status,
          code: err.code,
          originalError: err.originalError,
        });
        
        // レートリミットエラーの検出（拡張版）
        const errorMessage = err.message || '';
        const errorStatus = err.status || err.code;
        
        if (
          errorMessage === 'RATE_LIMIT_EXCEEDED' ||
          errorStatus === 429 ||
          errorMessage.includes('quota') ||
          errorMessage.includes('Quota exceeded') ||
          errorMessage.includes('Quota') ||
          errorMessage.includes('rate limit') ||
          errorMessage.includes('Rate limit') ||
          errorMessage.includes('RESOURCE_EXHAUSTED') ||
          (errorStatus >= 429 && errorStatus < 500)
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

