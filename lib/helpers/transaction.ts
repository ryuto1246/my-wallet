/**
 * トランザクション関連のヘルパー関数
 */

import { Transaction, TransactionInput, PaymentMethodValue } from "@/types/transaction";
import { TransactionFormValues } from "@/lib/validations/transaction";
import type { BalanceAdjustment } from "@/types";

/**
 * 振替かどうかを判定
 */
export function isTransferTransaction(transaction: Transaction): boolean {
  // transactionTypeまたはtransferプロパティで判定
  if (transaction.transactionType === 'transfer' || transaction.transfer) {
    return true;
  }
  // カテゴリで判定（既存データ対応）
  if (transaction.category.main === '振替' || transaction.category.sub === '口座間振替') {
    return true;
  }
  return false;
}

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
      txDate.getMonth() === targetMonth && txDate.getFullYear() === targetYear && !isTransferTransaction(t)
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
 * 残高調整を仮想取引として変換
 */
export function convertAdjustmentToTransaction(
  adjustment: BalanceAdjustment
): Transaction {
  const isIncome = adjustment.difference > 0;
  return {
    id: `adjustment-${adjustment.id}`,
    userId: adjustment.userId,
    date: adjustment.date,
    amount: Math.abs(adjustment.difference),
    category: {
      main: "その他",
      sub: "残高確認(修正)",
    },
    description: adjustment.memo || "残高確認(修正)",
    paymentMethod: adjustment.paymentMethod,
    isIncome,
    memo: `期待残高: ¥${adjustment.expectedBalance.toLocaleString()}, 実際の残高: ¥${adjustment.actualBalance.toLocaleString()}`,
    createdAt: adjustment.createdAt,
    updatedAt: adjustment.updatedAt || adjustment.createdAt,
  };
}

/**
 * 取引と残高調整を統合
 * @param transactions 取引リスト
 * @param adjustments 残高調整リスト
 * @param dateRange 日付範囲（指定した場合、その範囲内の残高調整のみを統合）
 */
export function mergeTransactionsAndAdjustments(
  transactions: Transaction[],
  adjustments: BalanceAdjustment[],
  dateRange?: { startDate: Date; endDate: Date }
): Transaction[] {
  // 日付範囲が指定されている場合、その範囲内の残高調整のみを統合
  let filteredAdjustments = adjustments;
  if (dateRange) {
    // 日付のみで比較するため、時刻をリセット
    const startDateOnly = new Date(dateRange.startDate);
    startDateOnly.setHours(0, 0, 0, 0);
    const endDateOnly = new Date(dateRange.endDate);
    endDateOnly.setHours(23, 59, 59, 999);
    
    filteredAdjustments = adjustments.filter((adj) => {
      const adjDate = new Date(adj.date);
      adjDate.setHours(0, 0, 0, 0);
      return adjDate >= startDateOnly && adjDate <= endDateOnly;
    });
  }
  
  const adjustmentTransactions = filteredAdjustments.map(convertAdjustmentToTransaction);
  return [...transactions, ...adjustmentTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
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
 * TransactionInput を TransactionFormValues に変換
 * 一括登録など、複数ページで同じ変換が必要な場合に使用する
 */
export function convertTransactionInputToFormValues(
  input: TransactionInput
): TransactionFormValues {
  return {
    date: input.date,
    amount: input.amount,
    categoryMain: input.category.main,
    categorySub: input.category.sub,
    description: input.description,
    paymentMethod: input.paymentMethod,
    isIncome: input.isIncome,
    isTransfer: input.isTransfer ?? false,
    hasAdvance: !!input.advance,
    transfer: input.transfer,
    advance: input.advance
      ? {
          type: input.advance.type || null,
          totalAmount: input.advance.totalAmount || input.amount,
          advanceAmount: input.advance.advanceAmount || 0,
          personalAmount: input.advance.personalAmount || input.amount,
          memo: input.advance.memo || "",
        }
      : undefined,
    memo: input.memo || "",
    imageUrl: input.imageUrl,
    ai: input.ai,
    originalMerchantName: input.ai?.originalMerchantName,
  };
}

/**
 * 振替フォームの入力値を TransactionFormValues に変換
 */
export function buildTransferFormValues(data: {
  date: Date;
  amount: number;
  from: string;
  to: string;
  description: string;
  memo?: string;
}): TransactionFormValues {
  return {
    date: data.date,
    amount: data.amount,
    categoryMain: "振替",
    categorySub: "口座間振替",
    description: data.description,
    paymentMethod: data.from as PaymentMethodValue,
    isIncome: false,
    isTransfer: true,
    hasAdvance: false,
    transfer: {
      from: data.from as PaymentMethodValue,
      to: data.to as PaymentMethodValue,
    },
    memo: data.memo || "",
  };
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
    paymentMethod: PaymentMethodValue;
    isIncome: boolean;
    transactionType?: "expense" | "income" | "transfer";
    transfer?: {
      from: PaymentMethodValue;
      to: PaymentMethodValue;
    };
    memo?: string;
    imageUrl?: string;
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
    paymentMethod: data.paymentMethod as PaymentMethodValue,
    isIncome: data.isIncome,
  };

  // 振替の場合はトランザクションタイプを設定
  if (data.isTransfer && data.transfer) {
    baseTransaction.transactionType = 'transfer';
    baseTransaction.transfer = {
      from: data.transfer.from as PaymentMethodValue,
      to: data.transfer.to as PaymentMethodValue,
    };
  } else {
    baseTransaction.transactionType = data.isIncome ? 'income' : 'expense';
  }

  // メモがある場合は追加
  if (data.memo) {
    baseTransaction.memo = data.memo;
  }

  // 画像URLがある場合は追加
  if (data.imageUrl) {
    baseTransaction.imageUrl = data.imageUrl;
  }

  // AI情報が直接渡されている場合は追加（一括登録時など）
  if (data.ai) {
    baseTransaction.ai = data.ai as {
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
  }
  // 元の店舗名またはユーザーキーワードがある場合はAI情報として追加（フォーム入力時）
  else if (data.originalMerchantName || data.userKeyword) {
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
    .filter((t) => !t.isIncome && !isTransferTransaction(t))
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
    if (isTransferTransaction(t)) return;

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

/**
 * 期間別の統計を計算
 */
export function calculatePeriodStats(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): MonthlyStats {
  const periodTransactions = transactions.filter((t) => {
    const txDate = new Date(t.date);
    return txDate >= startDate && txDate <= endDate && !isTransferTransaction(t);
  });

  const income = periodTransactions
    .filter((t) => t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = periodTransactions
    .filter((t) => !t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    income,
    expense,
    balance: income - expense,
  };
}

/**
 * 決済手段別の残高を計算
 */
export interface PaymentMethodBalance {
  paymentMethod: string;
  income: number;
  expense: number;
  balance: number;
  adjustedBalance?: number; // 確認後の残高
  lastAdjustmentDate?: Date; // 最終確認日
}

export function calculatePaymentMethodBalances(
  transactions: Transaction[],
  adjustments?: BalanceAdjustment[],
  asOfDate?: Date
): PaymentMethodBalance[] {
  // 指定日がある場合、その日以前のトランザクションと調整のみを使用
  const filteredTransactions = asOfDate
    ? transactions.filter((t) => new Date(t.date) <= asOfDate)
    : transactions;
  
  const filteredAdjustments = asOfDate && adjustments
    ? adjustments.filter((adj) => new Date(adj.date) <= asOfDate)
    : adjustments;

  const balanceMap = new Map<
    string,
    { income: number; expense: number; balance: number; lastAdjustmentDate?: Date }
  >();

  // 決済手段ごとの最新調整を取得
  const latestAdjustmentMap = new Map<string, BalanceAdjustment>();
  if (filteredAdjustments) {
    filteredAdjustments.forEach((adj) => {
      const existing = latestAdjustmentMap.get(adj.paymentMethod);
      if (!existing || new Date(adj.date) > new Date(existing.date)) {
        latestAdjustmentMap.set(adj.paymentMethod, adj);
      }
    });
  }

  // 各決済手段の残高を計算（振替も考慮してマップを初期化）
  filteredTransactions.forEach((t) => {
    if (!balanceMap.has(t.paymentMethod)) {
      balanceMap.set(t.paymentMethod, { income: 0, expense: 0, balance: 0 });
    }
    // 振替の場合、振替先も初期化
    if (isTransferTransaction(t) && t.transfer?.to) {
      if (!balanceMap.has(t.transfer.to)) {
        balanceMap.set(t.transfer.to, { income: 0, expense: 0, balance: 0 });
      }
    }
  });

  // 最新調整がある決済手段も初期化
  latestAdjustmentMap.forEach((adj, method) => {
    if (!balanceMap.has(method)) {
      balanceMap.set(method, { income: 0, expense: 0, balance: 0 });
    }
  });

  // 各決済手段の残高を計算
  balanceMap.forEach((data, method) => {
    const latestAdjustment = latestAdjustmentMap.get(method);
    
    if (latestAdjustment) {
      // 最終確認以降の取引のみを集計（振替元/先も含む）
      const transactionsAfterAdjustment = filteredTransactions.filter((t) => {
        const isAfterAdjustment = new Date(t.date) > new Date(latestAdjustment.date);
        const isRelatedToMethod = t.paymentMethod === method || 
                                   (t.transfer && (t.transfer.from === method || t.transfer.to === method));
        return isRelatedToMethod && isAfterAdjustment;
      });

      let income = 0;
      let expense = 0;

      transactionsAfterAdjustment.forEach((t) => {
        if (isTransferTransaction(t) && t.transfer) {
          // 振替の場合
          if (t.transfer.from === method) {
            // 振替元：支出として扱う（残高計算のみ、統計には含めない）
            expense += t.amount;
          } else if (t.transfer.to === method) {
            // 振替先：収入として扱う（残高計算のみ、統計には含めない）
            income += t.amount;
          }
        } else {
          // 通常の取引
          if (t.isIncome) {
            income += t.amount;
          } else {
            expense += t.amount;
          }
        }
      });

      // 最新の実際の残高 + その後の収支
      const balance = latestAdjustment.actualBalance + income - expense;
      
      balanceMap.set(method, {
        income,
        expense,
        balance,
        lastAdjustmentDate: latestAdjustment.date,
      });
    } else {
      // 確認がない場合は全期間の収支
      const methodTransactions = filteredTransactions.filter((t) => {
        // この決済手段に関連する取引（通常の取引 + 振替元/先）
        return t.paymentMethod === method || 
               (t.transfer && (t.transfer.from === method || t.transfer.to === method));
      });
      
      let income = 0;
      let expense = 0;

      methodTransactions.forEach((t) => {
        if (isTransferTransaction(t) && t.transfer) {
          // 振替の場合
          if (t.transfer.from === method) {
            // 振替元：支出として扱う（残高計算のみ）
            expense += t.amount;
          } else if (t.transfer.to === method) {
            // 振替先：収入として扱う（残高計算のみ）
            income += t.amount;
          }
        } else {
          // 通常の取引
          if (t.isIncome) {
            income += t.amount;
          } else {
            expense += t.amount;
          }
        }
      });

      balanceMap.set(method, {
        income,
        expense,
        balance: income - expense,
      });
    }
  });

  return Array.from(balanceMap.entries())
    .map(([paymentMethod, data]) => ({
      paymentMethod,
      income: data.income,
      expense: data.expense,
      balance: data.balance,
      lastAdjustmentDate: data.lastAdjustmentDate,
    }))
    .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
}

