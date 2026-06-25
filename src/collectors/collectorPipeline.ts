import type { NormalizedNote } from "../shared/types";
import type { Collector } from "./types";

export async function collectKeywordCandidates(keyword: string, limit: number, collectors: Collector[]) {
  const byUrl = new Map<string, NormalizedNote>();

  for (const collector of collectors) {
    let notes: NormalizedNote[] = [];
    try {
      notes = await collector.collect(keyword, limit);
    } catch {
      continue;
    }
    for (const note of notes) {
      if (!byUrl.has(note.url)) byUrl.set(note.url, note);
      if (byUrl.size >= limit) break;
    }
    if (byUrl.size >= limit) break;
  }

  return [...byUrl.values()].slice(0, limit);
}
