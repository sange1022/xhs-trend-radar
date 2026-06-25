import type { ScanRun, ScoredNote } from "../shared/types";

function metricText(note: ScoredNote) {
  const likes = note.metrics.likes ?? "-";
  const collects = note.metrics.collects ?? "-";
  const comments = note.metrics.comments ?? "-";
  return `赞 ${likes} / 藏 ${collects} / 评 ${comments}`;
}

export function createMarkdownReport(run: ScanRun) {
  const lines: string[] = [];

  lines.push(`# 小红书爆款雷达日报 ${run.date}`);
  lines.push("");
  lines.push(`生成时间：${run.generatedAt}`);
  lines.push(`关键词：${run.keywords.join("、") || "无"}`);
  lines.push("");
  lines.push("## 今日结论");
  lines.push("");

  if (run.insights.length === 0) {
    lines.push("- 今日没有足够公开数据形成结论。");
  } else {
    for (const insight of run.insights) {
      lines.push(`- **${insight.keyword}**：${insight.direction}`);
      lines.push(`  - 理由：${insight.rationale}`);
      lines.push(`  - 可参考标题：${insight.titlePatterns.join("；") || "暂无"}`);
      lines.push(`  - 高频话题：${insight.topics.join("、") || "暂无"}`);
    }
  }

  lines.push("");
  lines.push("## 榜单证据");
  lines.push("");

  const byKeyword = new Map<string, ScoredNote[]>();
  for (const note of run.notes) {
    byKeyword.set(note.keyword, [...(byKeyword.get(note.keyword) ?? []), note]);
  }

  for (const keyword of run.keywords) {
    lines.push(`### ${keyword}`);
    const notes = byKeyword.get(keyword) ?? [];
    if (notes.length === 0) {
      lines.push("- 今日无可用公开结果。");
      lines.push("");
      continue;
    }

    notes.slice(0, 10).forEach((note, index) => {
      lines.push(`${index + 1}. **${note.title}**`);
      lines.push(`   - 评分：${note.score}｜${metricText(note)}｜状态：${note.status}`);
      lines.push(`   - 话题：${note.topics.join("、") || "未识别"}`);
      lines.push(`   - 链接：${note.url}`);
      if (note.flags.length > 0) lines.push(`   - 数据提示：${note.flags.join(", ")}`);
    });
    lines.push("");
  }

  if (run.errors.length > 0) {
    lines.push("## 采集提示");
    lines.push("");
    run.errors.forEach((error) => lines.push(`- ${error}`));
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}
