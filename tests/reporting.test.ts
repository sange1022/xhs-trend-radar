import { describe, expect, it } from "vitest";
import { createMarkdownReport } from "../src/reporting/markdown";
import type { ScanRun } from "../src/shared/types";

describe("createMarkdownReport", () => {
  it("writes conclusions before ranked evidence", () => {
    const run: ScanRun = {
      runId: "2026-06-25",
      date: "2026-06-25",
      generatedAt: "2026-06-25T09:00:00.000Z",
      keywords: ["护肤"],
      notes: [
        {
          id: "n1",
          keyword: "护肤",
          title: "油皮夏天别乱护肤",
          summary: "强调控油和修护",
          topics: ["油皮", "护肤"],
          url: "https://www.xiaohongshu.com/explore/n1",
          author: "作者A",
          publishedAt: "2026-06-24T00:00:00.000Z",
          metrics: { likes: 120, collects: 90, comments: 20 },
          source: "public-browser",
          collectedAt: "2026-06-25T09:00:00.000Z",
          completeness: 1,
          score: 88,
          scoreBreakdown: {
            interaction: 40,
            saveValue: 25,
            recency: 15,
            completeness: 8
          },
          status: "strong_hit",
          flags: []
        }
      ],
      insights: [
        {
          keyword: "护肤",
          direction: "控油修护组合",
          titlePatterns: ["油皮夏天别乱护肤"],
          topics: ["油皮", "护肤"],
          rationale: "收藏占比高，适合做实用教程。"
        }
      ],
      errors: []
    };

    const markdown = createMarkdownReport(run);

    expect(markdown.indexOf("## 今日结论")).toBeLessThan(markdown.indexOf("## 榜单证据"));
    expect(markdown).toContain("控油修护组合");
    expect(markdown).toContain("油皮夏天别乱护肤");
    expect(markdown).toContain("https://www.xiaohongshu.com/explore/n1");
  });
});
