import type { KeywordInsight, ScoredNote } from "../shared/types";

function topTopics(notes: ScoredNote[]) {
  const counts = new Map<string, number>();
  for (const note of notes) {
    for (const topic of note.topics) counts.set(topic, (counts.get(topic) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic)
    .slice(0, 6);
}

function inferDirection(keyword: string, notes: ScoredNote[]) {
  const strong = notes.find((note) => note.status === "strong_hit") ?? notes[0];
  if (!strong) return `${keyword} 今日公开数据不足`;
  const topics = topTopics(notes).filter((topic) => topic !== keyword).slice(0, 2);
  return topics.length > 0 ? `${topics.join(" + ")} 相关内容值得跟进` : `${keyword} 的高互动标题值得跟进`;
}

export function createInsights(keywords: string[], notes: ScoredNote[]): KeywordInsight[] {
  return keywords.map((keyword) => {
    const keywordNotes = notes.filter((note) => note.keyword === keyword).slice(0, 8);
    const topics = topTopics(keywordNotes);
    const topTitles = keywordNotes.slice(0, 3).map((note) => note.title);
    const withMetrics = keywordNotes.filter((note) => !note.flags.includes("missing_metrics"));

    return {
      keyword,
      direction: inferDirection(keyword, keywordNotes),
      titlePatterns: topTitles,
      topics,
      rationale:
        withMetrics.length > 0
          ? "综合评分结合互动强度、收藏价值、近期权重和数据完整度。"
          : "公开结果缺少互动数据，今天先作为标题和话题方向参考。"
    };
  });
}
