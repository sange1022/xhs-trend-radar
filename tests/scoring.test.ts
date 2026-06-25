import { describe, expect, it } from "vitest";
import { scoreNotes } from "../src/scoring/score";
import type { NormalizedNote } from "../src/shared/types";

const baseNote: NormalizedNote = {
  id: "note-1",
  keyword: "护肤",
  title: "夏天油皮护肤流程",
  summary: "控油、防晒、修护",
  topics: ["护肤", "油皮"],
  url: "https://www.xiaohongshu.com/explore/example",
  author: "示例作者",
  publishedAt: "2026-06-24T00:00:00.000Z",
  metrics: {
    likes: 100,
    collects: 50,
    comments: 10
  },
  source: "public-browser",
  collectedAt: "2026-06-25T00:00:00.000Z",
  completeness: 1
};

describe("scoreNotes", () => {
  it("ranks notes by composite heat, save value, recency, and completeness", () => {
    const ranked = scoreNotes(
      [
        {
          ...baseNote,
          id: "older-big",
          publishedAt: "2026-05-01T00:00:00.000Z",
          metrics: { likes: 300, collects: 80, comments: 20 }
        },
        {
          ...baseNote,
          id: "recent-saved",
          publishedAt: "2026-06-24T00:00:00.000Z",
          metrics: { likes: 180, collects: 160, comments: 30 }
        }
      ],
      new Date("2026-06-25T00:00:00.000Z")
    );

    expect(ranked[0].id).toBe("recent-saved");
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
    expect(ranked[0].scoreBreakdown.saveValue).toBeGreaterThan(ranked[1].scoreBreakdown.saveValue);
  });

  it("marks notes with missing metrics as title/topic references, not strong hits", () => {
    const ranked = scoreNotes(
      [
        {
          ...baseNote,
          id: "missing",
          metrics: {},
          completeness: 0.45
        }
      ],
      new Date("2026-06-25T00:00:00.000Z")
    );

    expect(ranked[0].status).toBe("reference_only");
    expect(ranked[0].flags).toContain("missing_metrics");
    expect(ranked[0].score).toBeLessThan(35);
    expect(Number.isInteger(ranked[0].score)).toBe(true);
  });
});
