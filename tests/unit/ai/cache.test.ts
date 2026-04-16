import { cacheGet, cacheSet, makeCacheKey, normalizeText, roundAmount, TTL_24H } from "@/lib/ai/cache";

describe("ai/cache", () => {
  test("normalizeText lowers, trims and removes punctuation", () => {
    expect(normalizeText(" スターバックス！ ")).toBe("スターバックス");
    expect(normalizeText("Hello, World!")).toBe("hello world");
  });

  test("roundAmount rounds to nearest unit", () => {
    expect(roundAmount(123, 100)).toBe(100);
    expect(roundAmount(149, 100)).toBe(100);
    expect(roundAmount(150, 100)).toBe(200);
    expect(roundAmount(undefined, 100)).toBeUndefined();
  });

  test("cacheSet/cacheGet returns stored value before TTL expiry (memory fallback)", () => {
    const key = makeCacheKey(["k", 1, "v"]);
    cacheSet(key, { ok: true }, TTL_24H);
    type Value = { ok: boolean };
    const v = cacheGet<Value>(key);
    expect(v && v.ok).toBe(true);
  });
});

