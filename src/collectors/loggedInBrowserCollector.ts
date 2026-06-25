import type { BrowserContext } from "playwright";
import type { NormalizedNote } from "../shared/types";
import { cleanNoteDisplayText } from "../shared/textCleanup";
import { extractVisibleMetrics } from "../shared/visibleMetrics";
import { getLoginContext } from "./loginSession";
import type { Collector } from "./types";

function topicsFromText(keyword: string, text: string) {
  const hashTopics = [...text.matchAll(/#([\p{Script=Han}\w-]{2,20})/gu)].map((match) => match[1]);
  const words = text
    .split(/[｜|,，。！!？?\s]+/)
    .filter((part) => part.length >= 2 && part.length <= 12 && /[\p{Script=Han}]/u.test(part))
    .slice(0, 5);
  return [...new Set([keyword, ...hashTopics, ...words])].slice(0, 8);
}

async function extractNotes(context: BrowserContext, keyword: string, limit: number, collectedAt: string) {
  const page = await context.newPage();
  try {
    await page.goto(`https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000
    });
    await page.waitForTimeout(5_000);
    await page.mouse.wheel(0, 1600);
    await page.waitForTimeout(2_000);

    const raw = await page.evaluate((maxItems) => {
      const anchors = [...document.querySelectorAll<HTMLAnchorElement>('a[href*="/explore/"]')];
      return anchors.slice(0, maxItems * 4).map((anchor) => {
        const container = anchor.closest("section, article, div") ?? anchor;
        return {
          href: anchor.href,
          anchorText: (anchor.textContent ?? "").replace(/\s+/g, " ").trim(),
          text: (container.textContent ?? anchor.textContent ?? "").replace(/\s+/g, " ").trim()
        };
      });
    }, limit);

    const seen = new Set<string>();
    const notes: NormalizedNote[] = [];
    for (const [index, item] of raw.entries()) {
      if (notes.length >= limit) break;
      if (!item.href || seen.has(item.href)) continue;
      const title = cleanNoteDisplayText((item.anchorText || item.text).slice(0, 110));
      if (title.length < 4) continue;
      seen.add(item.href);

      const metrics = extractVisibleMetrics(item.text);
      const { likes, collects, comments } = metrics;
      const hasMetric = likes !== undefined || collects !== undefined || comments !== undefined;

      notes.push({
        id: `login-${keyword}-${index}-${Buffer.from(item.href).toString("base64url").slice(0, 10)}`,
        keyword,
        title,
        summary: cleanNoteDisplayText(item.text.slice(0, 220)),
        topics: topicsFromText(keyword, item.text),
        url: item.href,
        author: "登录会话",
        publishedAt: null,
        metrics,
        source: "logged-in-browser",
        collectedAt,
        completeness: hasMetric ? 0.86 : 0.62
      });
    }

    return notes;
  } finally {
    await page.close();
  }
}

export class LoggedInBrowserCollector implements Collector {
  name = "logged-in-browser";

  async collect(keyword: string, limit: number): Promise<NormalizedNote[]> {
    const context = getLoginContext();
    if (!context) return [];
    return extractNotes(context, keyword, limit, new Date().toISOString());
  }
}
