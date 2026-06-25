import { describe, expect, it } from "vitest";
import { cleanNoteDisplayText } from "../src/shared/textCleanup";

describe("cleanNoteDisplayText", () => {
  it("removes date and trailing metric noise from concatenated card text", () => {
    expect(cleanNoteDisplayText("被问爆的法式中古餐边柜+咖啡角｜尺寸抄作业angel的小家03-112136")).toBe(
      "被问爆的法式中古餐边柜+咖啡角｜尺寸抄作业angel的小家"
    );
  });

  it("keeps normal Chinese titles intact", () => {
    expect(cleanNoteDisplayText("中古风 | 跟着小红书学装修 NO.16")).toBe("中古风 | 跟着小红书学装修 NO.16");
  });
});
