export type NoteSource = "public-browser" | "logged-in-browser" | "search-fallback" | "demo";

export type NoteStatus = "strong_hit" | "watch" | "reference_only";

export interface NoteMetrics {
  likes?: number;
  collects?: number;
  comments?: number;
}

export interface NormalizedNote {
  id: string;
  keyword: string;
  title: string;
  summary: string;
  topics: string[];
  url: string;
  author: string;
  publishedAt: string | null;
  metrics: NoteMetrics;
  source: NoteSource;
  collectedAt: string;
  completeness: number;
}

export interface ScoreBreakdown {
  interaction: number;
  saveValue: number;
  recency: number;
  completeness: number;
}

export interface ScoredNote extends NormalizedNote {
  score: number;
  scoreBreakdown: ScoreBreakdown;
  status: NoteStatus;
  flags: string[];
}

export interface KeywordInsight {
  keyword: string;
  direction: string;
  titlePatterns: string[];
  topics: string[];
  rationale: string;
}

export interface ScanRun {
  runId: string;
  date: string;
  generatedAt: string;
  keywords: string[];
  notes: ScoredNote[];
  insights: KeywordInsight[];
  errors: string[];
}
