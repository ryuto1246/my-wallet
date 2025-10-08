/**
 * 重複検出ロジック
 * スクショから認識された取引が既存の取引と重複していないかチェック
 */

import type { Transaction } from '@/types/transaction';
import type {
  RecognizedTransaction,
  DuplicateDetectionResult,
} from '@/types/image-recognition';

/**
 * 重複検出のオプション
 */
interface DuplicateDetectionOptions {
  /** 類似度の閾値（0-1、デフォルト: 0.8） */
  threshold?: number;
  /** 日付の許容範囲（日数、デフォルト: 1） */
  dateTolerance?: number;
  /** 金額の許容誤差（%、デフォルト: 5） */
  amountTolerance?: number;
}

/**
 * 認識された取引が既存の取引と重複していないかチェック
 * @param recognizedTransaction 認識された取引
 * @param existingTransactions 既存の取引リスト
 * @param options オプション
 * @returns 重複検出結果
 */
export function detectDuplicate(
  recognizedTransaction: RecognizedTransaction,
  existingTransactions: Transaction[],
  options: DuplicateDetectionOptions = {}
): DuplicateDetectionResult {
  const threshold = options.threshold ?? 0.8;
  const dateTolerance = options.dateTolerance ?? 1;
  const amountTolerance = options.amountTolerance ?? 5;

  // 認識された取引に必要な情報が不足している場合
  if (!recognizedTransaction.date || !recognizedTransaction.amount) {
    return {
      isDuplicate: false,
      similarityScore: 0,
      matchingTransactionIds: [],
      reason: '取引情報が不完全です',
    };
  }

  // 各既存取引との類似度を計算
  const similarities = existingTransactions.map((transaction) => {
    const score = calculateSimilarity(
      recognizedTransaction,
      transaction,
      { dateTolerance, amountTolerance }
    );
    return {
      transactionId: transaction.id,
      score,
      transaction,
    };
  });

  // 類似度の高い順にソート
  similarities.sort((a, b) => b.score - a.score);

  // 閾値を超える取引を抽出
  const matches = similarities.filter((s) => s.score >= threshold);

  if (matches.length === 0) {
    return {
      isDuplicate: false,
      similarityScore: similarities[0]?.score || 0,
      matchingTransactionIds: [],
    };
  }

  // 重複の理由を生成
  const topMatch = matches[0];
  const reason = generateDuplicateReason(
    recognizedTransaction,
    topMatch.transaction
  );

  return {
    isDuplicate: true,
    similarityScore: topMatch.score,
    matchingTransactionIds: matches.map((m) => m.transactionId),
    reason,
  };
}

/**
 * 2つの取引の類似度を計算
 * @returns 類似度スコア（0-1）
 */
function calculateSimilarity(
  recognized: RecognizedTransaction,
  existing: Transaction,
  options: { dateTolerance: number; amountTolerance: number }
): number {
  let totalScore = 0;
  let weights = 0;

  // 1. 日付の類似度（重み: 30%）
  if (recognized.date) {
    // FirestoreのTimestampをDateに変換
    const existingDate = existing.date instanceof Date 
      ? existing.date 
      : (existing.date as { toDate: () => Date }).toDate();
    
    const dateScore = calculateDateSimilarity(
      recognized.date,
      existingDate,
      options.dateTolerance
    );
    totalScore += dateScore * 0.3;
    weights += 0.3;
  }

  // 2. 金額の類似度（重み: 40%）
  if (recognized.amount !== null) {
    const amountScore = calculateAmountSimilarity(
      recognized.amount,
      existing.amount,
      options.amountTolerance
    );
    totalScore += amountScore * 0.4;
    weights += 0.4;
  }

  // 3. 店舗名の類似度（重み: 20%）
  if (recognized.merchantName) {
    const merchantScore = calculateTextSimilarity(
      recognized.merchantName,
      existing.description
    );
    totalScore += merchantScore * 0.2;
    weights += 0.2;
  }

  // 4. 決済方法の類似度（重み: 10%）
  if (recognized.paymentService) {
    const paymentScore = calculatePaymentSimilarity(
      recognized.paymentService,
      existing.paymentMethod
    );
    totalScore += paymentScore * 0.1;
    weights += 0.1;
  }

  // 重みの合計で正規化
  return weights > 0 ? totalScore / weights : 0;
}

/**
 * 日付の類似度を計算
 */
function calculateDateSimilarity(
  date1: Date,
  date2: Date,
  toleranceDays: number
): number {
  const diffMs = Math.abs(date1.getTime() - date2.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays === 0) return 1.0; // 完全一致
  if (diffDays <= toleranceDays) return 0.9; // 許容範囲内
  if (diffDays <= toleranceDays * 2) return 0.5; // やや近い
  return 0.0; // 遠い
}

/**
 * 金額の類似度を計算
 */
function calculateAmountSimilarity(
  amount1: number,
  amount2: number,
  tolerancePercent: number
): number {
  if (amount1 === amount2) return 1.0; // 完全一致

  const diff = Math.abs(amount1 - amount2);
  const maxAmount = Math.max(amount1, amount2);
  const diffPercent = (diff / maxAmount) * 100;

  if (diffPercent <= tolerancePercent) return 0.95; // 許容範囲内
  if (diffPercent <= tolerancePercent * 2) return 0.6; // やや近い
  if (diffPercent <= tolerancePercent * 3) return 0.3; // 遠い
  return 0.0; // かなり遠い
}

/**
 * テキストの類似度を計算（店舗名など）
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  // 正規化（小文字化、空白削除）
  const normalized1 = normalizeText(text1);
  const normalized2 = normalizeText(text2);

  // 完全一致
  if (normalized1 === normalized2) return 1.0;

  // 部分一致（どちらかが含まれる）
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 0.8;
  }

  // レーベンシュタイン距離を使用
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  const similarity = 1 - distance / maxLength;

  return Math.max(0, similarity);
}

/**
 * テキストを正規化
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[ー−‐－]/g, '') // ハイフン類を削除
    .replace(/[\u3000]/g, ''); // 全角スペースを削除
}

/**
 * レーベンシュタイン距離を計算
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // 削除
          dp[i][j - 1] + 1, // 挿入
          dp[i - 1][j - 1] + 1 // 置換
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * 決済方法の類似度を計算
 */
function calculatePaymentSimilarity(
  paymentService: string,
  paymentMethod: string
): number {
  // 決済サービスと決済方法のマッピング
  const serviceToMethodMap: Record<string, string[]> = {
    olive: ['三井住友 OLIVE', 'olive', 'クレジットカード', 'デビットカード'],
    sony: ['ソニー銀行', 'sony', 'デビットカード', '銀行振込'],
    dpayment: ['d払い', 'dpayment', 'd払い', 'スマホ決済'],
    dcard: ['dカード', 'dcard', 'クレジットカード'],
    paypay: ['PayPay', 'paypay', 'スマホ決済'],
    cash: ['現金', 'cash'],
  };

  const methods = serviceToMethodMap[paymentService] || [];
  const normalizedPaymentMethod = normalizeText(paymentMethod);

  for (const method of methods) {
    if (normalizeText(method) === normalizedPaymentMethod) {
      return 1.0;
    }
    if (normalizedPaymentMethod.includes(normalizeText(method))) {
      return 0.8;
    }
  }

  return 0.0;
}

/**
 * 重複の理由を生成
 */
function generateDuplicateReason(
  recognized: RecognizedTransaction,
  existing: Transaction
): string {
  const reasons: string[] = [];

  // 日付が近い
  if (recognized.date) {
    // FirestoreのTimestampをDateに変換
    const existingDate = existing.date instanceof Date 
      ? existing.date 
      : (existing.date as { toDate: () => Date }).toDate();
    
    const diffMs = Math.abs(
      recognized.date.getTime() - existingDate.getTime()
    );
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays <= 1) {
      reasons.push('日付が一致');
    }
  }

  // 金額が近い
  if (
    recognized.amount !== null &&
    Math.abs(recognized.amount - existing.amount) <= existing.amount * 0.05
  ) {
    reasons.push('金額が一致');
  }

  // 店舗名が類似
  if (
    recognized.merchantName &&
    calculateTextSimilarity(recognized.merchantName, existing.description) >= 0.7
  ) {
    reasons.push('店舗名が類似');
  }

  if (reasons.length === 0) {
    return '類似した取引が見つかりました';
  }

  return reasons.join('、') + 'しています';
}

/**
 * 複数の認識結果から重複を一括チェック
 * @param recognizedTransactions 認識された取引の配列
 * @param existingTransactions 既存の取引リスト
 * @param options オプション
 * @returns 重複なしの取引と重複した取引のペア
 */
export function batchDetectDuplicates(
  recognizedTransactions: RecognizedTransaction[],
  existingTransactions: Transaction[],
  options: DuplicateDetectionOptions = {}
): {
  unique: RecognizedTransaction[];
  duplicates: Array<{
    transaction: RecognizedTransaction;
    result: DuplicateDetectionResult;
  }>;
} {
  const unique: RecognizedTransaction[] = [];
  const duplicates: Array<{
    transaction: RecognizedTransaction;
    result: DuplicateDetectionResult;
  }> = [];

  for (const transaction of recognizedTransactions) {
    const result = detectDuplicate(transaction, existingTransactions, options);

    if (result.isDuplicate) {
      duplicates.push({ transaction, result });
    } else {
      unique.push(transaction);
    }
  }

  return { unique, duplicates };
}

