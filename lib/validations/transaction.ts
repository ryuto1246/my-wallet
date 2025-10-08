/**
 * トランザクションフォームのバリデーションスキーマ
 */

import { z } from 'zod';

// 立替情報のスキーマ
export const advanceInfoSchema = z.object({
  type: z.enum(['friend', 'parent']).nullable(),
  totalAmount: z.number().positive(),
  advanceAmount: z.number().min(0),
  personalAmount: z.number().min(0),
  memo: z.string().optional(),
}).refine(
  (data) => {
    // totalAmount = advanceAmount + personalAmount のチェック
    return Math.abs(data.totalAmount - (data.advanceAmount + data.personalAmount)) < 0.01;
  },
  {
    message: '支払総額は立替金額と自己負担額の合計と一致する必要があります',
    path: ['totalAmount'],
  }
);

// 振替情報のスキーマ
export const transferInfoSchema = z.object({
  from: z.string().min(1, '振替元を選択してください'),
  to: z.string().min(1, '振替先を選択してください'),
}).refine(
  (data) => data.from !== data.to,
  {
    message: '振替元と振替先は異なる必要があります',
    path: ['to'],
  }
);

export const transactionFormSchema = z.object({
  date: z.date({ message: '日付を選択してください' }),
  amount: z
    .number({ message: '金額を入力してください' })
    .positive('金額は正の数である必要があります')
    .max(100000000, '金額が大きすぎます'),
  categoryMain: z
    .string({ message: 'メインカテゴリーを選択してください' })
    .min(1, 'メインカテゴリーを選択してください'),
  categorySub: z
    .string({ message: 'サブカテゴリーを選択してください' })
    .min(1, 'サブカテゴリーを選択してください'),
  description: z
    .string({ message: '項目名を入力してください' })
    .min(1, '項目名を入力してください')
    .max(100, '項目名は100文字以内で入力してください'),
  paymentMethod: z
    .string({ message: '決済方法を選択してください' })
    .min(1, '決済方法を選択してください'),
  isIncome: z.boolean(),
  isTransfer: z.boolean().default(false),
  hasAdvance: z.boolean().default(false),
  memo: z.string().optional(),
  // 立替情報（任意）
  advance: advanceInfoSchema.optional(),
  // 振替情報（任意）
  transfer: transferInfoSchema.optional(),
  // 画像認識時の元の店舗名（内部使用）
  originalMerchantName: z.string().optional(),
  // ユーザーが入力したキーワード（内部使用）
  userKeyword: z.string().optional(),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
