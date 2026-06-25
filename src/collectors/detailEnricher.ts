import { chromium, type BrowserContext } from "playwright";
import type { NormalizedNote } from "../shared/types";
import { extractVisibleMetrics } from "../shared/visibleMetrics";
import { findChromeExecutable } from "./browserRuntime";
import { extractTopicsFromDetailText, mergeTopics } from "./detailExtraction";
import { getLoginContext } from "./loginSession";

async function createFallbackContext() {
  const executablePath = await findChromeExecutable();
  const browser = await chromium.launch({ headless: true, executablePath });
  return {
    context: await browser.newContext({
      locale: "zh-CN",
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    }),
    close: async () => browser.close()
  };
}

async function enrichOne(context: BrowserContext, note: NormalizedNote): Promise<NormalizedNote> {
  const page = await context.newPage();
  try {
    await page.goto(note.url, { waitUntil: "domcontentloaded", timeout: 18_000 });
    await page.waitForTimeout(2_500);
    const detailText = await page.locator("body").innerText({ timeout: 6_000 });
    const detailTopics = extractTopicsFromDetailText(detailText);
    const metrics = { ...extractVisibleMetrics(detailText), ...note.metrics };

    return {
      ...note,
      topics: mergeTopics(note.topics, detailTopics),
      metrics,
      completeness: Math.min(1, note.completeness + (detailTopics.length > 0 ? 0.18 : 0) + (metrics.likes ? 0.08 : 0))
    };
  } catch {
    return note;
  } finally {
    await page.close().catch(() => undefined);
  }
}

export async function enrichNotesWithDetails(notes: NormalizedNote[], maxCount: number) {
  if (notes.length === 0 || maxCount <= 0) return notes;

  const loginContext = getLoginContext();
  const fallback = loginContext ? null : await createFallbackContext();
  const context = loginContext ?? fallback!.context;

  try {
    const enriched: NormalizedNote[] = [];
    const targetIds = new Set(notes.slice(0, maxCount).map((note) => note.id));

    for (const note of notes) {
      if (!targetIds.has(note.id)) {
        enriched.push(note);
        continue;
      }
      enriched.push(await enrichOne(context, note));
    }

    return enriched;
  } finally {
    await fallback?.close();
  }
}
