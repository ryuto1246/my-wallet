/**
 * 画像認識カスタムフック
 * 画像のアップロード、認識、重複チェックを統合
 */

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { useTransactions } from './useTransactions';
import {
  uploadTransactionImageWithProgress,
  validateImageFile,
} from '@/lib/firebase/storage';
import { recognizeTransactionFromImage } from '@/lib/gemini/vision';
import { detectDuplicate } from '@/lib/helpers/duplicate-detection';
import type {
  ImageRecognitionResult,
  RecognizedTransaction,
  OCROptions,
} from '@/types/image-recognition';
import { buildPriorHints, rerankRecognition } from '@/lib/ai/personalization';

interface UseImageRecognitionOptions {
  /** 重複チェックを行うか */
  checkDuplicates?: boolean;
  /** 重複判定の閾値 */
  duplicateThreshold?: number;
  /** 自動適用するか（重複がない場合） */
  autoApply?: boolean;
}

interface UseImageRecognitionReturn {
  /** 認識結果のリスト */
  results: ImageRecognitionResult[];
  /** 認識中か */
  isRecognizing: boolean;
  /** エラーメッセージ */
  error: string | null;
  /** 画像をアップロードして認識 */
  recognizeImages: (files: File[], options?: OCROptions) => Promise<void>;
  /** 結果をクリア */
  clearResults: () => void;
  /** 特定の結果を削除 */
  removeResult: (index: number) => void;
  /** 結果を取得（適用用） */
  getRecognizedTransaction: (
    index: number
  ) => RecognizedTransaction | null;
}

export function useImageRecognition(
  options: UseImageRecognitionOptions = {}
): UseImageRecognitionReturn {
  const { checkDuplicates = true, duplicateThreshold = 0.8 } = options;

  const [results, setResults] = useState<ImageRecognitionResult[]>([]);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();
  const { transactions } = useTransactions();

  /**
   * 画像をアップロードして認識
   */
  const recognizeImages = useCallback(
    async (files: File[], ocrOptions: OCROptions = {}) => {
      if (!user) {
        setError('ログインが必要です');
        return;
      }

      setIsRecognizing(true);
      setError(null);

      const newResults: ImageRecognitionResult[] = [];

      try {
        // 各ファイルを処理
        for (const file of files) {
          // バリデーション
          const validation = validateImageFile(file);
          if (!validation.isValid) {
            newResults.push({
              imageUrl: '',
              previewUrl: URL.createObjectURL(file),
              transaction: {
                paymentService: 'unknown',
                date: null,
                amount: null,
                merchantName: null,
                confidence: 0,
                rawData: {
                  fullText: '',
                  rawResponse: '',
                  confidence: 0,
                },
              },
              status: 'error',
              error: validation.error,
            });
            continue;
          }

          // プレビューURLを作成
          const previewUrl = URL.createObjectURL(file);

          // 初期状態を追加
          const initialResult: ImageRecognitionResult = {
            imageUrl: '',
            previewUrl,
            transaction: {
              paymentService: 'unknown',
              date: null,
              amount: null,
              merchantName: null,
              confidence: 0,
              rawData: {
                fullText: '',
                rawResponse: '',
                confidence: 0,
              },
            },
            status: 'processing',
          };

          newResults.push(initialResult);
          setResults((prev) => [...prev, initialResult]);

          try {
            // 1. Firebase Storageにアップロード
            const imageUrl = await uploadTransactionImageWithProgress(
              file,
              user.id,
              (progress) => {
                // 進捗更新（必要に応じて）
                console.log('Upload progress:', progress.percentage);
              }
            );

            // 2. 画像を認識
            const recognizedTransaction = await recognizeTransactionFromImage(
              file,
              ocrOptions
            );

            // 2.5 履歴ヒントで軽量リランク（LLMなし）
            try {
              const inputText = recognizedTransaction.merchantName || '';
              if (user && inputText.trim()) {
                const hints = await buildPriorHints({
                  userId: user.id,
                  inputText,
                });
                const [reranked] = rerankRecognition([recognizedTransaction], hints);
                recognizedTransaction.suggestedCategory =
                  reranked.suggestedCategory || recognizedTransaction.suggestedCategory;
                recognizedTransaction.confidence =
                  reranked.confidence ?? recognizedTransaction.confidence;
              }
            } catch (e) {
              console.warn('rerankRecognition skipped:', e);
            }

            // 3. 重複チェック
            let duplicateInfo;
            if (checkDuplicates && transactions.length > 0) {
              duplicateInfo = detectDuplicate(
                recognizedTransaction,
                transactions,
                { threshold: duplicateThreshold }
              );
            }

            // 4. 結果を更新
            const finalResult: ImageRecognitionResult = {
              imageUrl,
              previewUrl,
              transaction: recognizedTransaction,
              status: 'success',
              duplicateInfo,
            };

            // 配列内の該当結果を更新
            setResults((prev) =>
              prev.map((r) =>
                r.previewUrl === previewUrl ? finalResult : r
              )
            );
          } catch (err) {
            console.error('認識エラー:', err);
            
            // レートリミットエラーの検出
            const isRateLimit = err instanceof Error && 
              (err.message === 'RATE_LIMIT_EXCEEDED' ||
               err.message.includes('quota') ||
               err.message.includes('Quota exceeded') ||
               err.message.includes('rate limit'));
            
            // エラー状態に更新
            setResults((prev) =>
              prev.map((r) =>
                r.previewUrl === previewUrl
                  ? {
                      ...r,
                      status: 'error',
                      error: isRateLimit
                        ? 'API利用制限に達しました。しばらく時間をおいてから再度お試しください。'
                        : err instanceof Error
                        ? err.message
                        : '認識に失敗しました',
                    }
                  : r
              )
            );
          }
        }
      } catch (err) {
        console.error('認識処理エラー:', err);
        
        // レートリミットエラーの検出
        const isRateLimit = err instanceof Error && 
          (err.message === 'RATE_LIMIT_EXCEEDED' ||
           err.message.includes('quota') ||
           err.message.includes('Quota exceeded') ||
           err.message.includes('rate limit'));
        
        setError(
          isRateLimit
            ? 'API利用制限に達しました。しばらく時間をおいてから再度お試しください。'
            : err instanceof Error
            ? err.message
            : '認識処理に失敗しました'
        );
      } finally {
        setIsRecognizing(false);
      }
    },
    [user, transactions, checkDuplicates, duplicateThreshold]
  );

  /**
   * 結果をクリア
   */
  const clearResults = useCallback(() => {
    // プレビューURLをクリーンアップ
    results.forEach((result) => {
      if (result.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(result.previewUrl);
      }
    });
    setResults([]);
    setError(null);
  }, [results]);

  /**
   * 特定の結果を削除
   */
  const removeResult = useCallback((index: number) => {
    setResults((prev) => {
      const result = prev[index];
      // プレビューURLをクリーンアップ
      if (result?.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(result.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  /**
   * 認識された取引を取得
   */
  const getRecognizedTransaction = useCallback(
    (index: number): RecognizedTransaction | null => {
      const result = results[index];
      if (!result || result.status !== 'success') {
        return null;
      }
      return result.transaction;
    },
    [results]
  );

  return {
    results,
    isRecognizing,
    error,
    recognizeImages,
    clearResults,
    removeResult,
    getRecognizedTransaction,
  };
}

