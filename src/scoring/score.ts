import type { NormalizedNote, ScoredNote, ScoreBreakdown } from "../shared/types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function metricSum(note: NormalizedNote) {
  return (note.metrics.likes ?? 0) + (note.metrics.collects ?? 0) + (note.metrics.comments ?? 0);
}

function hasMetrics(note: NormalizedNote) {
  return note.metrics.likes !== undefined || note.metrics.collects !== undefined || note.metrics.comments !== undefined;
}

function daysOld(note: NormalizedNote, now: Date) {
  if (!note.publishedAt) return 30;
  const ageMs = now.getTime() - new Date(note.publishedAt).getTime();
  if (!Number.isFinite(ageMs)) return 30;
  return Math.max(0, ageMs / 86_400_000);
}

function calculateBreakdown(note: NormalizedNote, maxTotal: number, now: Date): ScoreBreakdown {
  const total = metricSum(note);
  const collects = note.metrics.collects ?? 0;
  const comments = note.metrics.comments ?? 0;
  const saveRatio = total > 0 ? collects / total : 0;
  const discussionRatio = total > 0 ? comments / total : 0;
  const age = daysOld(note, now);

  return {
    interaction: hasMetrics(note) ? clamp((Math.log10(total + 1) / Math.log10(maxTotal + 1)) * 45, 0, 45) : 0,
    saveValue: hasMetrics(note) ? clamp(saveRatio * 30 + discussionRatio * 8, 0, 30) : 0,
    recency: clamp(18 * Math.exp(-age / 10), 0, 18),
    completeness: clamp(note.completeness * 7, 0, 7)
  };
}

function statusFor(score: number, flags: string[]) {
  if (flags.includes("missing_metrics")) return "reference_only" as const;
  if (score >= 70) return "strong_hit" as const;
  return "watch" as const;
}

export function scoreNotes(notes: NormalizedNote[], now = new Date()): ScoredNote[] {
  const maxTotal = Math.max(1, ...notes.map(metricSum));

  return notes
    .map((note) => {
      const flags: string[] = [];
      if (!hasMetrics(note)) flags.push("missing_metrics");
      if (!note.publishedAt) flags.push("missing_published_at");

      const scoreBreakdown = calculateBreakdown(note, maxTotal, now);
      const rawScore = Object.values(scoreBreakdown).reduce((sum, value) => sum + value, 0);
      const score = Math.round(flags.includes("missing_metrics") ? Math.min(34, rawScore) : rawScore);

      return {
        ...note,
        score,
        scoreBreakdown,
        status: statusFor(score, flags),
        flags
      };
    })
    .sort((a, b) => b.score - a.score);
}
