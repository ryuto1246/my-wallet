/**
 * トランザクション（収支）関連の型定義
 */

import { Category } from './category';
import { AdvanceInfo } from './advance';
import { CalendarLink } from './calendar';

export const PaymentMethod = {
  OLIVE: 'olive',           // 三井住友OLIVE
  SONY_BANK: 'sony_bank',   // ソニー銀行
  D_PAYMENT: 'd_payment',   // d払い
  D_CARD: 'd_card',         // dカード
  PAYPAY: 'paypay',         // PayPay
  CASH: 'cash',             // 現金
  OTHER: 'other',           // その他
} as const;

export type PaymentMethodValue = typeof PaymentMethod[keyof typeof PaymentMethod];

export interface AISuggestion {
  suggested: boolean;       // AIによる提案かどうか
  confidence: number;       // 確信度（0-1）
  originalSuggestion: {
    category: Category;
    description: string;
  };
  userModified: boolean;    // ユーザーが修正したかどうか
  originalMerchantName?: string; // 画像認識時の元の店舗名（画像から追加された場合のみ）
  userKeyword?: string;     // ユーザーが最後に入力したキーワード
}

export interface Transaction {
  id: string;
  userId: string;
  date: Date;
  amount: number;
  category: Category;
  description: string;
  paymentMethod: PaymentMethodValue;
  isIncome: boolean;
  advance?: AdvanceInfo;    // 立替情報（任意）
  calendar?: CalendarLink;  // カレンダー連携情報（任意）
  ai?: AISuggestion;        // AI提案情報（任意）
  imageUrl?: string;        // スクショのURL（任意）
  memo?: string;            // メモ（任意）
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionFormData {
  date: Date;
  amount: number;
  category: Category;
  description: string;
  paymentMethod: PaymentMethodValue;
  isIncome: boolean;
  advance?: Partial<AdvanceInfo>;
  calendarEventId?: string;
  imageUrl?: string;
  memo?: string;
  ai?: Partial<AISuggestion>; // AI情報（画像認識時の元の店舗名など）
}

export interface TransactionInput {
  date: Date;
  amount: number;
  category: Category;
  description: string;
  paymentMethod: PaymentMethodValue | string;
  isIncome: boolean;
  advance?: Partial<AdvanceInfo>;
  imageUrl?: string;
  memo?: string;
  ai?: Partial<AISuggestion>; // AI情報（画像認識時の元の店舗名など）
}

export interface TransactionFilter {
  startDate?: Date;
  endDate?: Date;
  categoryMain?: string;
  categorySub?: string;
  paymentMethod?: PaymentMethodValue;
  isIncome?: boolean;
  includeAdvance?: boolean;  // 立替を含むかどうか
  minAmount?: number;
  maxAmount?: number;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  advanceTotal?: {
    totalAdvanced: number;
    totalRecovered: number;
    remaining: number;
  };
}

