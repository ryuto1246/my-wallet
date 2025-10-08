/**
 * トランザクション関連のヘルパー関数
 */

import { Transaction } from "@/types/transaction";
import { TransactionFormValues } from "@/lib/validations/transaction";

/**
 * 月次統計を計算
 */
export interface MonthlyStats {
  income: number;
  expense: number;
  balance: number;
}

export function calculateMonthlyStats(
  transactions: Transaction[],
  year?: number,
  month?: number
): MonthlyStats {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth();

  const monthlyTransactions = transactions.filter((t) => {
    const txDate = new Date(t.date);
    return (
      txDate.getMonth() === targetMonth && txDate.getFullYear() === targetYear
    );
  });

  const income = monthlyTransactions
    .filter((t) => t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = monthlyTransactions
    .filter((t) => !t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    income,
    expense,
    balance: income - expense,
  };
}

/**
 * 最近のトランザクションを取得
 */
export function getRecentTransactions(
  transactions: Transaction[],
  limit: number = 5
): Transaction[] {
  return [...transactions].slice(0, limit);
}

/**
 * トランザクションを期間でフィルタリング
 */
export function filterTransactionsByDateRange(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): Transaction[] {
  return transactions.filter((t) => {
    const txDate = new Date(t.date);
    return txDate >= startDate && txDate <= endDate;
  });
}

/**
 * トランザクションをカテゴリでフィルタリング
 */
export function filterTransactionsByCategory(
  transactions: Transaction[],
  categoryMain: string,
  categorySub?: string
): Transaction[] {
  return transactions.filter((t) => {
    const mainMatches = t.category.main === categoryMain;
    if (categorySub) {
      return mainMatches && t.category.sub === categorySub;
    }
    return mainMatches;
  });
}

/**
 * 収入/支出でフィルタリング
 */
export function filterTransactionsByType(
  transactions: Transaction[],
  isIncome: boolean
): Transaction[] {
  return transactions.filter((t) => t.isIncome === isIncome);
}

/**
 * フォームバリデーションデータをトランザクション作成データに変換
 */
export function transformFormDataToTransaction(
  data: TransactionFormValues
): Omit<Transaction, "id" | "userId" | "createdAt" | "updatedAt"> {
  const baseTransaction: {
    date: Date;
    amount: number;
    category: { main: string; sub: string };
    description: string;
    paymentMethod: "olive" | "sony_bank" | "d_payment" | "d_card" | "paypay" | "cash" | "other";
    isIncome: boolean;
    memo?: string;
    ai?: {
      suggested: boolean;
      confidence: number;
      originalSuggestion: {
        category: { main: string; sub: string };
        description: string;
      };
      userModified: boolean;
      originalMerchantName?: string;
      userKeyword?: string;
    };
  } = {
    date: data.date,
    amount: data.amount,
    category: {
      main: data.categoryMain,
      sub: data.categorySub,
    },
    description: data.description,
    paymentMethod: data.paymentMethod as
      | "olive"
      | "sony_bank"
      | "d_payment"
      | "d_card"
      | "paypay"
      | "cash"
      | "other",
    isIncome: data.isIncome,
  };

  // メモがある場合は追加
  if (data.memo) {
    baseTransaction.memo = data.memo;
  }

  // 元の店舗名またはユーザーキーワードがある場合はAI情報として追加
  if (data.originalMerchantName || data.userKeyword) {
    const aiInfo: {
      suggested: boolean;
      confidence: number;
      originalSuggestion: {
        category: { main: string; sub: string };
        description: string;
      };
      userModified: boolean;
      originalMerchantName?: string;
      userKeyword?: string;
    } = {
      suggested: true,
      confidence: 1.0,
      originalSuggestion: {
        category: {
          main: data.categoryMain,
          sub: data.categorySub,
        },
        description: data.description,
      },
      userModified: false,
    };
    
    if (data.originalMerchantName) {
      aiInfo.originalMerchantName = data.originalMerchantName;
    }
    if (data.userKeyword) {
      aiInfo.userKeyword = data.userKeyword;
    }
    
    baseTransaction.ai = aiInfo;
  }

  // 立替情報がある場合は追加
  if (data.hasAdvance && data.advance) {
    const advanceInfo: {
      type: 'friend' | 'parent' | null;
      totalAmount: number;
      advanceAmount: number;
      personalAmount: number;
      isRecovered: boolean;
      memo?: string;
    } = {
      type: data.advance.type,
      totalAmount: data.advance.totalAmount,
      advanceAmount: data.advance.advanceAmount,
      personalAmount: data.advance.personalAmount,
      isRecovered: false, // 新規作成時は未回収
    };

    // memoがある場合のみ追加（undefinedを避ける）
    if (data.advance.memo) {
      advanceInfo.memo = data.advance.memo;
    }

    return {
      ...baseTransaction,
      advance: advanceInfo,
    };
  }

  return baseTransaction;
}

/**
 * カテゴリ別の支出を集計
 */
export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
}

export function calculateCategoryTotals(
  transactions: Transaction[]
): CategoryTotal[] {
  const categoryMap = new Map<string, { total: number; count: number }>();

  transactions
    .filter((t) => !t.isIncome)
    .forEach((t) => {
      const categoryKey = `${t.category.main}/${t.category.sub}`;
      const current = categoryMap.get(categoryKey) || { total: 0, count: 0 };
      categoryMap.set(categoryKey, {
        total: current.total + t.amount,
        count: current.count + 1,
      });
    });

  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      ...data,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * 日別の支出を集計
 */
export interface DailyTotal {
  date: string;
  income: number;
  expense: number;
  balance: number;
}

export function calculateDailyTotals(
  transactions: Transaction[]
): DailyTotal[] {
  const dailyMap = new Map<
    string,
    { income: number; expense: number }
  >();

  transactions.forEach((t) => {
    const dateKey = new Date(t.date).toISOString().split("T")[0];
    const current = dailyMap.get(dateKey) || { income: 0, expense: 0 };

    if (t.isIncome) {
      dailyMap.set(dateKey, { ...current, income: current.income + t.amount });
    } else {
      dailyMap.set(dateKey, {
        ...current,
        expense: current.expense + t.amount,
      });
    }
  });

  return Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      ...data,
      balance: data.income - data.expense,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

