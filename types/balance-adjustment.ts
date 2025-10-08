/**
 * 残高調整関連の型定義
 */

import { PaymentMethodValue } from './transaction';

/**
 * 残高調整情報
 */
export interface BalanceAdjustment {
  id: string;
  userId: string;
  date: Date;
  paymentMethod: PaymentMethodValue;
  expectedBalance: number;  // システム計算上の残高
  actualBalance: number;    // 実際の残高
  difference: number;       // 差額（実際 - 期待）
  memo?: string;            // メモ（任意）
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * 残高調整入力データ
 */
export interface BalanceAdjustmentInput {
  date: Date;
  paymentMethod: PaymentMethodValue;
  actualBalance: number;
  memo?: string;
}

