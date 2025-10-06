/**
 * ユーザー関連の型定義
 */

import { PaymentMethodValue } from './transaction';

export interface UserSettings {
  defaultPaymentMethod: PaymentMethodValue;
  calendarEnabled: boolean;
  aiSuggestionEnabled: boolean;
  currency: string;
  locale: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

