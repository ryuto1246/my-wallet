/**
 * AI学習データ関連の型定義
 */

import { Category } from './category';
import { PaymentMethodValue } from './transaction';

export interface AILearningContext {
  amount: number;
  paymentMethod: PaymentMethodValue;
  timeOfDay: string;        // 'morning' | 'afternoon' | 'evening' | 'night'
  dayOfWeek: string;        // 'monday' | 'tuesday' | ...
  storeName?: string;       // 店舗名（もしあれば）
}

export interface AILearningData {
  id: string;
  userId: string;
  originalText: string;     // 元のテキスト（店名など）
  aiSuggestion: {
    category: Category;
    description: string;
  };
  userCorrection: {
    category: Category;
    description: string;
  };
  context: AILearningContext;
  timestamp: Date;
}

export interface AIPattern {
  userId: string;
  storeName: string;
  timeOfDay: string;
  dayOfWeek: string;
  mostLikelyCategory: Category;
  mostLikelyDescription: string;
  confidence: number;
  occurrenceCount: number;
  lastUsed: Date;
}

