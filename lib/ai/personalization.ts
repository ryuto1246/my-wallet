/**
 * 履歴からPrior Hintsを生成し、AIプロンプトに注入可能な軽量メタデータを返す
 */

import {
  getPastPatterns,
  getSimilarPatterns,
  getUserCorrections,
} from "@/lib/firebase/ai-learning";
import type { Category } from "@/types/category";

export type PriorCandidate = {
  description: string;
  category: { main: string; sub: string };
  weight: number; // 0-1
};

export type AidPrior = {
  friend: number; // 友人立替の事前確率
  parent: number; // 親援助の事前確率
  none: number; // 立替なし
  typicalRatio?: number; // 典型的な割合（0-1）
};

export type PriorHints = {
  topCandidates: PriorCandidate[];
  aidPrior?: AidPrior;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const detectAidSignals = (text: string): { friend: number; parent: number; ratio?: number } => {
  const t = text.toLowerCase();
  let friend = 0;
  let parent = 0;
  let ratio: number | undefined = undefined;

  // 簡易キーワード検出（日本語・かな/カナ・英語）
  const friendKeys = ["友達", "友人", "割り勘", "立替", "立て替え", "ワリカン", "split"];
  const parentKeys = ["親", "親負担", "援助", "仕送り"];

  if (friendKeys.some((k) => t.includes(k))) friend += 1;
  if (parentKeys.some((k) => t.includes(k))) parent += 1;

  // 典型比率のヒューリスティック
  if (t.includes("半分") || t.includes("1/2") || t.includes("50%")) ratio = 0.5;
  else if (t.includes("3割") || t.includes("30%") || t.includes("0.3")) ratio = 0.3;
  else if (t.includes("全額") || t.includes("100%") || t.includes("1.0")) ratio = 1.0;

  return { friend, parent, ratio };
};

/**
 * 履歴から上位候補を抽出し、最大3件のPrior Hintsを返す
 */
export const buildPriorHints = async (params: {
  userId?: string;
  inputText: string;
}): Promise<PriorHints> => {
  const { userId, inputText } = params;
  if (!userId || !inputText.trim()) {
    return { topCandidates: [] };
  }

  // 1) 過去の完全一致テキスト
  const past = await getPastPatterns(userId, inputText);
  // 2) 類似テキスト（部分一致・単語共有）
  const similar = await getSimilarPatterns(userId, inputText, 50);
  // 3) 総履歴（重み付けに利用）
  const all = await getUserCorrections(userId, 200);

  type Acc = {
    key: string;
    description: string;
    category: { main: string; sub: string };
    score: number;
    aidFriendHits: number;
    aidParentHits: number;
    ratios: number[];
  };
  const map = new Map<string, Acc>();

  const push = (desc: string, cat: Category, base: number) => {
    const key = `${cat.main}::${cat.sub}::${desc}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        description: desc,
        category: { main: cat.main, sub: cat.sub },
        score: 0,
        aidFriendHits: 0,
        aidParentHits: 0,
        ratios: [],
      });
    }
    const acc = map.get(key)!;
    acc.score += base;
    const signals = detectAidSignals(desc);
    acc.aidFriendHits += signals.friend;
    acc.aidParentHits += signals.parent;
    if (signals.ratio !== undefined) acc.ratios.push(signals.ratio);
  };

  // 完全一致は高評価
  past.forEach((p, idx) => {
    const recency = 1 - Math.min(idx / Math.max(past.length - 1, 1), 1); // 新しいほど高い
    push(p.userCorrection.description, p.userCorrection.category, 2.0 + 0.5 * recency);
  });

  // 類似一致は中評価
  similar.forEach((p, idx) => {
    const recency = 1 - Math.min(idx / Math.max(similar.length - 1, 1), 1);
    push(p.userCorrection.description, p.userCorrection.category, 1.0 + 0.3 * recency);
  });

  // 総履歴でカテゴリの頻度を弱く加点
  const categoryFreq = new Map<string, number>();
  all.forEach((p) => {
    const k = `${p.userCorrection.category.main}:${p.userCorrection.category.sub}`;
    categoryFreq.set(k, (categoryFreq.get(k) || 0) + 1);
  });
  const maxFreq = Math.max(1, ...Array.from(categoryFreq.values()));

  map.forEach((acc) => {
    const k = `${acc.category.main}:${acc.category.sub}`;
    const freq = categoryFreq.get(k) || 0;
    acc.score += 0.3 * (freq / maxFreq);
  });

  // 上位3件を選出し、スコアを0-1へ正規化
  const sorted = Array.from(map.values()).sort((a, b) => b.score - a.score).slice(0, 3);
  const maxScore = Math.max(1, ...sorted.map((s) => s.score));
  const topCandidates: PriorCandidate[] = sorted.map((s) => ({
    description: s.description,
    category: s.category,
    weight: clamp01(s.score / maxScore),
  }));

  // 援助事前確率の推定
  let friendHits = 0;
  let parentHits = 0;
  let total = 0;
  const ratios: number[] = [];

  all.forEach((p) => {
    total += 1;
    const sig = detectAidSignals(p.userCorrection.description);
    friendHits += sig.friend > 0 ? 1 : 0;
    parentHits += sig.parent > 0 ? 1 : 0;
    if (sig.ratio !== undefined) ratios.push(sig.ratio);
  });

  let aidPrior: AidPrior | undefined;
  if (total > 0) {
    const friend = friendHits / total;
    const parent = parentHits / total;
    const none = clamp01(1 - friend - parent);
    const typicalRatio =
      ratios.length > 0 ? clamp01(ratios.reduce((a, b) => a + b, 0) / ratios.length) : undefined;
    aidPrior = { friend: clamp01(friend), parent: clamp01(parent), none, typicalRatio };
  }

  return { topCandidates, aidPrior };
};

/**
 * 画像認識結果の軽量な再評価（LLM呼出は行わない）
 * - 既存の推測が「その他」や未設定の場合に、上位候補で補完
 */
export const rerankRecognition = <T extends {
  merchantName?: string | null;
  suggestedCategory?: { main: string; sub: string } | null;
  confidence?: number | null;
}>(items: T[], hints: PriorHints): T[] => {
  if (!items.length || hints.topCandidates.length === 0) return items;
  const top = hints.topCandidates[0];

  return items.map((it) => {
    const needOverride =
      !it.suggestedCategory ||
      !it.suggestedCategory.main ||
      !it.suggestedCategory.sub ||
      it.suggestedCategory.main === "その他";

    if (!needOverride) return it;
    return {
      ...it,
      suggestedCategory: {
        main: top.category.main,
        sub: top.category.sub,
      },
      confidence: Math.max(0.7, (it.confidence ?? 0)), // 下限を少し引き上げる
    };
  });
};

