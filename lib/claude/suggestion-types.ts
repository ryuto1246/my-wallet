/**
 * AI サジェスチョン関連の型定義
 */

import type { Category } from '@/types/category';
import type { PaymentMethodValue } from '@/types/transaction';

export interface SuggestionContext {
  userId?: string;
  priorHints?: {
    topCandidates: Array<{ description: string; category: { main: string; sub: string }; weight: number }>;
    aidPrior?: { friend: number; parent: number; none: number; typicalRatio?: number };
  };
  amount?: number;
  paymentMethod?: PaymentMethodValue;
  timeOfDay?: string;
  dayOfWeek?: string;
  isIncome?: boolean;
}

export interface AISuggestion {
  category: Category;
  description: string;
  isIncome: boolean;
  confidence: number;
  hasAdvance?: boolean;
  advanceType?: string | null;  // 任意の相手名（自由記述）
  advanceAmount?: number;
}

export const isLowConfidence = (confidence: number): boolean => confidence < 0.7;

export const getConfidenceLevel = (confidence: number): 'high' | 'medium' | 'low' => {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
};
