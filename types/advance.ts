/**
 * 立替処理関連の型定義
 */

export const AdvanceStatus = {
  PENDING: 'pending',       // 未回収（保留中）
  RECOVERED: 'recovered',   // 回収済み
  ABANDONED: 'abandoned',   // 放棄（回収を諦めた）
} as const;

export type AdvanceStatusValue = typeof AdvanceStatus[keyof typeof AdvanceStatus];

export interface AdvanceInfo {
  type: string | null;        // 立替相手名（自由記述、例: "田中さん", "親", backward compat: "friend", "parent"）
  totalAmount: number;        // 支払い総額
  advanceAmount: number;      // 立替金額
  personalAmount: number;     // 自分の負担額
  status: AdvanceStatusValue; // 回収ステータス（新フィールド）
  isRecovered: boolean;       // 後方互換性のため残す（status === 'recovered' と同義）
  memo?: string;              // 立替の詳細メモ
}

export interface AdvanceBalance {
  userId: string;
  totalAdvanced: number;
  totalRecovered: number;
  remaining: number;
  updatedAt: Date;
}
