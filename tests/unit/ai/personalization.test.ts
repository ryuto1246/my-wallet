import { buildPriorHints } from "@/lib/ai/personalization";

jest.mock("@/lib/firebase/ai-learning", () => ({
  getPastPatterns: jest.fn().mockResolvedValue([]),
  getSimilarPatterns: jest.fn().mockResolvedValue([]),
  getUserCorrections: jest.fn().mockResolvedValue([]),
}));

describe("ai/personalization", () => {
  test("returns empty hints when no userId or no input", async () => {
    const h1 = await buildPriorHints({ userId: undefined, inputText: "スタバ" });
    expect(h1.topCandidates).toEqual([]);
    const h2 = await buildPriorHints({ userId: "u1", inputText: " " });
    expect(h2.topCandidates).toEqual([]);
  });

  test("returns valid structure", async () => {
    const hints = await buildPriorHints({ userId: "u1", inputText: "スタバ" });
    expect(Array.isArray(hints.topCandidates)).toBe(true);
    expect(hints.topCandidates.length).toBeLessThanOrEqual(3);
  });
});

