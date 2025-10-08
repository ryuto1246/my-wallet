/**
 * AI学習データのFirestore操作
 */

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { AILearningData, AILearningContext } from '@/types/ai-learning';
import { Category } from '@/types/category';

const COLLECTION_NAME = 'ai_learning';

/**
 * ユーザーの修正履歴を保存
 */
export const saveUserCorrection = async (
  userId: string,
  originalText: string,
  aiSuggestion: {
    category: Category;
    description: string;
  },
  userCorrection: {
    category: Category;
    description: string;
  },
  context: AILearningContext
): Promise<void> => {
  try {
    await addDoc(collection(db, COLLECTION_NAME), {
      userId,
      originalText,
      aiSuggestion,
      userCorrection,
      context,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving user correction:', error);
    throw error;
  }
};

/**
 * ユーザーの過去の修正履歴を取得
 */
export const getUserCorrections = async (
  userId: string,
  limitCount = 100
): Promise<AILearningData[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        originalText: data.originalText,
        aiSuggestion: data.aiSuggestion,
        userCorrection: data.userCorrection,
        context: data.context,
        timestamp: (data.timestamp as Timestamp).toDate(),
      };
    });
  } catch (error) {
    console.error('Error getting user corrections:', error);
    return [];
  }
};

/**
 * 特定の店舗/テキストに対する過去のパターンを取得
 */
export const getPastPatterns = async (
  userId: string,
  originalText: string
): Promise<AILearningData[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('originalText', '==', originalText),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        originalText: data.originalText,
        aiSuggestion: data.aiSuggestion,
        userCorrection: data.userCorrection,
        context: data.context,
        timestamp: (data.timestamp as Timestamp).toDate(),
      };
    });
  } catch (error) {
    console.error('Error getting past patterns:', error);
    return [];
  }
};

/**
 * 類似したテキストに対する過去のパターンを取得
 * より詳細なカテゴリ学習のため、部分一致でも検索
 */
export const getSimilarPatterns = async (
  userId: string,
  searchText: string,
  limitCount = 20
): Promise<AILearningData[]> => {
  try {
    // ユーザーの全履歴を取得（制限付き）
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const allPatterns = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        originalText: data.originalText,
        aiSuggestion: data.aiSuggestion,
        userCorrection: data.userCorrection,
        context: data.context,
        timestamp: (data.timestamp as Timestamp).toDate(),
      };
    });
    
    // テキストの類似度でフィルタリング
    const normalizedSearch = searchText.toLowerCase().trim();
    const similarPatterns = allPatterns.filter(p => {
      const normalizedOriginal = p.originalText.toLowerCase().trim();
      // 部分一致または単語の共通部分がある
      return normalizedOriginal.includes(normalizedSearch) ||
             normalizedSearch.includes(normalizedOriginal) ||
             hasCommonWords(normalizedSearch, normalizedOriginal);
    });
    
    return similarPatterns.slice(0, 10);
  } catch (error) {
    console.error('Error getting similar patterns:', error);
    return [];
  }
};

/**
 * 2つのテキストに共通の単語があるか判定
 */
const hasCommonWords = (text1: string, text2: string): boolean => {
  const words1 = text1.split(/\s+/).filter(w => w.length > 1);
  const words2 = text2.split(/\s+/).filter(w => w.length > 1);
  return words1.some(w => words2.includes(w));
};

/**
 * カテゴリー選択の頻度を分析
 * ユーザーの傾向を把握するためのデータを取得
 */
export const analyzeCategoryFrequency = async (
  userId: string,
  mainCategory?: string
): Promise<Map<string, { count: number; percentage: number }>> => {
  try {
    const corrections = await getUserCorrections(userId, 200);
    
    // カテゴリーの出現回数をカウント
    const categoryCount = new Map<string, number>();
    corrections.forEach(c => {
      const key = mainCategory
        ? c.userCorrection.category.sub
        : `${c.userCorrection.category.main}:${c.userCorrection.category.sub}`;
      
      categoryCount.set(key, (categoryCount.get(key) || 0) + 1);
    });
    
    // パーセンテージを計算
    const total = corrections.length;
    const result = new Map<string, { count: number; percentage: number }>();
    
    categoryCount.forEach((count, key) => {
      result.set(key, {
        count,
        percentage: (count / total) * 100,
      });
    });
    
    return result;
  } catch (error) {
    console.error('Error analyzing category frequency:', error);
    return new Map();
  }
};

/**
 * 時間帯別のカテゴリー傾向を分析
 */
export const analyzeTimeBasedPatterns = async (
  userId: string
): Promise<Map<string, Map<string, number>>> => {
  try {
    const corrections = await getUserCorrections(userId, 200);
    
    // 時間帯別のカテゴリーカウント
    const timePatterns = new Map<string, Map<string, number>>();
    
    corrections.forEach(c => {
      const timeOfDay = c.context.timeOfDay || 'unknown';
      const categoryKey = `${c.userCorrection.category.main}:${c.userCorrection.category.sub}`;
      
      if (!timePatterns.has(timeOfDay)) {
        timePatterns.set(timeOfDay, new Map());
      }
      
      const categoryMap = timePatterns.get(timeOfDay)!;
      categoryMap.set(categoryKey, (categoryMap.get(categoryKey) || 0) + 1);
    });
    
    return timePatterns;
  } catch (error) {
    console.error('Error analyzing time-based patterns:', error);
    return new Map();
  }
};

/**
 * 学習データから最も可能性の高いカテゴリーを推測
 */
export const predictFromHistory = async (
  userId: string,
  originalText: string,
  context: AILearningContext
): Promise<{
  category: Category;
  description: string;
  confidence: number;
} | null> => {
  const patterns = await getPastPatterns(userId, originalText);
  
  if (patterns.length === 0) {
    return null;
  }

  // コンテキストマッチングのスコアを計算
  const scoredPatterns = patterns.map(p => {
    let score = 0;
    
    // 時間帯が一致（重要度：高）
    if (p.context.timeOfDay === context.timeOfDay) {
      score += 3;
    }
    
    // 曜日が一致（重要度：中）
    if (p.context.dayOfWeek === context.dayOfWeek) {
      score += 2;
    }
    
    // 金額が近い（重要度：中）
    if (p.context.amount && context.amount) {
      const diff = Math.abs(p.context.amount - context.amount);
      const ratio = diff / context.amount;
      if (ratio < 0.2) score += 2; // 20%以内の誤差
      else if (ratio < 0.5) score += 1; // 50%以内の誤差
    }
    
    // 決済方法が一致（重要度：低）
    if (p.context.paymentMethod === context.paymentMethod) {
      score += 1;
    }
    
    return { pattern: p, score };
  });

  // スコアでソート
  scoredPatterns.sort((a, b) => b.score - a.score);
  
  const best = scoredPatterns[0];
  
  // スコアに基づいて確信度を計算
  const maxScore = 8; // 最大スコア（時間帯3 + 曜日2 + 金額2 + 決済方法1）
  const baseConfidence = 0.7;
  const scoreBonus = (best.score / maxScore) * 0.2; // 最大+0.2
  const confidence = Math.min(0.95, baseConfidence + scoreBonus);
  
  return {
    category: best.pattern.userCorrection.category,
    description: best.pattern.userCorrection.description,
    confidence,
  };
};

