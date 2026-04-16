/**
 * AIサジェスト結果キャッシュ（ブラウザ優先、SSR安全）
 */

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

// シンプルなインメモリフォールバック（SSRやlocalStorage非対応環境用）
const memoryCache = new Map<string, CacheEntry<unknown>>();

const now = () => Date.now();

export const roundAmount = (amount?: number, unit: number = 100): number | undefined => {
  if (amount === undefined || amount === null) return undefined;
  if (!isFinite(amount)) return undefined;
  return Math.round(amount / unit) * unit;
};

export const normalizeText = (text: string): string => {
  try {
    return text
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[\s\u3000]+/g, " ") // 空白類を半角スペースに
      .replace(/[^\p{L}\p{N}\s]/gu, "") // 記号除去（Unicode対応）
      .trim();
  } catch {
    return text.trim();
  }
};

export const simpleHash = (input: string): string => {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(31, h) + input.charCodeAt(i);
    h |= 0;
  }
  return (h >>> 0).toString(16);
};

export const makeCacheKey = (parts: Array<unknown>): string => {
  const json = JSON.stringify(parts);
  return simpleHash(json) + ":" + json; // 衝突耐性のためハッシュ＋生データ
};

const hasLocalStorage = (): boolean => {
  try {
    if (typeof window === "undefined") return false;
    const testKey = "__ai_cache_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

export const cacheGet = <T>(key: string): T | null => {
  const nowMs = now();
  if (hasLocalStorage()) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CacheEntry<T>;
      if (!parsed || typeof parsed.expiresAt !== "number") return null;
      if (parsed.expiresAt < nowMs) {
        window.localStorage.removeItem(key);
        return null;
      }
      return parsed.value;
    } catch {
      return null;
    }
  } else {
    const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (entry.expiresAt < nowMs) {
      memoryCache.delete(key);
      return null;
    }
    return entry.value;
  }
};

export const cacheSet = <T>(key: string, value: T, ttlMs: number): void => {
  const entry: CacheEntry<T> = {
    value,
    expiresAt: now() + ttlMs,
  };
  if (hasLocalStorage()) {
    try {
      window.localStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // localStorage容量超過などは無視（フォールバック不要）
    }
  } else {
    memoryCache.set(key, entry);
  }
};

export const TTL_24H = 24 * 60 * 60 * 1000;

