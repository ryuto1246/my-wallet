/**
 * 決済方法定数定義
 */

import { PaymentMethod, PaymentMethodValue } from '@/types/transaction';

export interface PaymentMethodInfo {
  value: PaymentMethodValue;
  label: string;
  icon?: string;
  color?: string;
}

export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  {
    value: PaymentMethod.OLIVE,
    label: '三井住友OLIVE',
    color: '#10B981', // エメラルドグリーン - より鮮やかな緑
  },
  {
    value: PaymentMethod.SMBC_BANK,
    label: '三井住友銀行',
    color: '#06B6D4', // シアン - OLIVEと明確に区別
  },
  {
    value: PaymentMethod.SONY_BANK,
    label: 'ソニー銀行',
    color: '#3B82F6', // 明るい青 - より視認性が高い
  },
  {
    value: PaymentMethod.D_PAYMENT,
    label: 'd払い',
    color: '#EF4444', // 明るい赤 - より鮮やか
  },
  {
    value: PaymentMethod.D_CARD,
    label: 'dカード',
    color: '#F97316', // オレンジ - d払いと区別
  },
  {
    value: PaymentMethod.PAYPAY,
    label: 'PayPay',
    color: '#DC2626', // PayPayレッド - ブランドカラーに近い
  },
  {
    value: PaymentMethod.CASH,
    label: '現金',
    color: '#8B5CF6', // パープル - より見やすく
  },
  {
    value: PaymentMethod.OTHER,
    label: 'その他',
    color: '#6B7280', // グレー
  },
];

/**
 * 決済方法のラベルを取得
 */
export const getPaymentMethodLabel = (method: PaymentMethodValue): string => {
  const paymentMethod = PAYMENT_METHODS.find(pm => pm.value === method);
  return paymentMethod?.label || method;
};

/**
 * 決済方法の色を取得
 */
export const getPaymentMethodColor = (method: PaymentMethodValue): string => {
  const paymentMethod = PAYMENT_METHODS.find(pm => pm.value === method);
  return paymentMethod?.color || '#6B7280';
};

