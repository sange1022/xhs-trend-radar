import { describe, expect, it } from "vitest";
import { extractVisibleMetrics } from "../src/shared/visibleMetrics";

describe("extractVisibleMetrics", () => {
  it("extracts trailing public like count after full date text", () => {
    expect(extractVisibleMetrics("用全屏live打开家的亮灯时刻煨灶猫2025-10-261137")).toEqual({
      likes: 1137
    });
  });

  it("extracts trailing public like count after month-day text", () => {
    expect(extractVisibleMetrics("被问爆的法式中古餐边柜+咖啡角｜尺寸抄作业angel的小家03-112136")).toEqual({
      likes: 2136
    });
  });

  it("prefers explicit labeled metrics when present", () => {
    expect(extractVisibleMetrics("赞 1.2万 收藏 320 评论 18")).toEqual({
      likes: 12000,
      collects: 320,
      comments: 18
    });
  });
});
