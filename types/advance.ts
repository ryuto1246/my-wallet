/**
 * 立替処理関連の型定義
 */

export const AdvanceType = {
  FRIEND: 'friend',  // 友人立替（後で回収する）
  PARENT: 'parent',  // 親負担（返済不要、支出にカウントしない）
} as const;

export type AdvanceTypeValue = typeof AdvanceType[keyof typeof AdvanceType];

export interface AdvanceInfo {
  type: AdvanceTypeValue | null;
  totalAmount: number;        // 支払い総額
  advanceAmount: number;      // 立替金額
  personalAmount: number;     // 自分の負担額
  isRecovered: boolean;       // 回収済みかどうか（friendの場合のみ）
  memo?: string;              // 立替の詳細メモ（例：「Aさん・Bさん・Cさん分」）
}

export interface AdvanceBalance {
  userId: string;
  totalAdvanced: number;      // 総立替金額
  totalRecovered: number;     // 総回収金額
  remaining: number;          // 未回収残高
  updatedAt: Date;
}

