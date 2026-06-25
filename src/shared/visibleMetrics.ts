import type { NoteMetrics } from "./types";

function parseCompactNumber(value: string, unit = "") {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return undefined;
  const normalizedUnit = unit.toLowerCase();
  if (unit === "万" || normalizedUnit === "w") return Math.round(numeric * 10_000);
  if (normalizedUnit === "k") return Math.round(numeric * 1_000);
  return Math.round(numeric);
}

function labeledMetric(text: string, labels: string[]) {
  for (const label of labels) {
    const match = text.match(new RegExp(`${label}\\s*(\\d+(?:\\.\\d+)?)(万|k|w)?`, "i"));
    if (!match) continue;
    return parseCompactNumber(match[1], match[2]);
  }
  return undefined;
}

export function extractVisibleMetrics(text: string): NoteMetrics {
  const metrics: NoteMetrics = {
    likes: labeledMetric(text, ["赞", "点赞"]),
    collects: labeledMetric(text, ["藏", "收藏"]),
    comments: labeledMetric(text, ["评", "评论"])
  };

  if (metrics.likes !== undefined || metrics.collects !== undefined || metrics.comments !== undefined) {
    return Object.fromEntries(Object.entries(metrics).filter(([, value]) => value !== undefined));
  }

  const fullDateTail = text.match(/\d{4}-\d{2}-\d{2}(\d{1,7})(?:\D*)$/u);
  if (fullDateTail) return { likes: Number(fullDateTail[1]) };

  const shortDateTail = text.match(/\d{1,2}-\d{1,2}(\d{1,7})(?:\D*)$/u);
  if (shortDateTail) return { likes: Number(shortDateTail[1]) };

  return {};
}
