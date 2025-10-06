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
    color: '#00A040',
  },
  {
    value: PaymentMethod.SONY_BANK,
    label: 'ソニー銀行',
    color: '#0063DB',
  },
  {
    value: PaymentMethod.D_PAYMENT,
    label: 'd払い',
    color: '#D32F2F',
  },
  {
    value: PaymentMethod.D_CARD,
    label: 'dカード',
    color: '#D32F2F',
  },
  {
    value: PaymentMethod.PAYPAY,
    label: 'PayPay',
    color: '#F53F3F',
  },
  {
    value: PaymentMethod.CASH,
    label: '現金',
    color: '#6B7280',
  },
  {
    value: PaymentMethod.OTHER,
    label: 'その他',
    color: '#9CA3AF',
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

