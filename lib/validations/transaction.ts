/**
 * トランザクションフォームのバリデーションスキーマ
 */

import { z } from 'zod';

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
  memo: z.string().optional(),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
