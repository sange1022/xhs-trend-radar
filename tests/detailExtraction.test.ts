import { describe, expect, it } from "vitest";
import { extractTopicsFromDetailText, mergeTopics } from "../src/collectors/detailExtraction";

describe("detailExtraction", () => {
  it("extracts hashtag topics from note detail text", () => {
    const topics = extractTopicsFromDetailText("今天分享一下我家的改造 #中古风装修 #餐边柜 #咖啡角 真的很实用");

    expect(topics).toEqual(["中古风装修", "餐边柜", "咖啡角"]);
  });

  it("merges existing and precise detail topics without duplicates", () => {
    expect(mergeTopics(["中古风装修", "标题参考"], ["中古风装修", "餐边柜"])).toEqual([
      "中古风装修",
      "餐边柜",
      "标题参考"
    ]);
  });
});
