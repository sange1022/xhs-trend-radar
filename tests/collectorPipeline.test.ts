import { describe, expect, it } from "vitest";
import { collectKeywordCandidates } from "../src/collectors/collectorPipeline";
import type { Collector } from "../src/collectors/types";

describe("collectKeywordCandidates", () => {
  it("dedupes candidate notes by url and falls back when the first collector is empty", async () => {
    const emptyCollector: Collector = {
      name: "empty",
      collect: async () => []
    };
    const fallbackCollector: Collector = {
      name: "fallback",
      collect: async () => [
        {
          id: "a",
          keyword: "护肤",
          title: "重复标题",
          summary: "摘要",
          topics: ["护肤"],
          url: "https://www.xiaohongshu.com/explore/a",
          author: "unknown",
          publishedAt: null,
          metrics: {},
          source: "search-fallback",
          collectedAt: "2026-06-25T00:00:00.000Z",
          completeness: 0.4
        },
        {
          id: "b",
          keyword: "护肤",
          title: "重复标题",
          summary: "摘要",
          topics: ["护肤"],
          url: "https://www.xiaohongshu.com/explore/a",
          author: "unknown",
          publishedAt: null,
          metrics: {},
          source: "search-fallback",
          collectedAt: "2026-06-25T00:00:00.000Z",
          completeness: 0.4
        }
      ]
    };

    const notes = await collectKeywordCandidates("护肤", 20, [emptyCollector, fallbackCollector]);

    expect(notes).toHaveLength(1);
    expect(notes[0].url).toBe("https://www.xiaohongshu.com/explore/a");
  });

  it("continues to fallback collectors when an earlier collector throws", async () => {
    const throwingCollector: Collector = {
      name: "throwing",
      collect: async () => {
        throw new Error("browser unavailable");
      }
    };
    const fallbackCollector: Collector = {
      name: "fallback",
      collect: async () => [
        {
          id: "fallback-note",
          keyword: "护肤",
          title: "兜底标题",
          summary: "摘要",
          topics: ["护肤"],
          url: "https://www.xiaohongshu.com/explore/fallback",
          author: "unknown",
          publishedAt: null,
          metrics: {},
          source: "search-fallback",
          collectedAt: "2026-06-25T00:00:00.000Z",
          completeness: 0.4
        }
      ]
    };

    const notes = await collectKeywordCandidates("护肤", 20, [throwingCollector, fallbackCollector]);

    expect(notes).toHaveLength(1);
    expect(notes[0].id).toBe("fallback-note");
  });
});
