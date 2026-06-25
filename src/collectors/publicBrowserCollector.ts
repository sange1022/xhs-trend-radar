import { chromium } from "playwright";
import type { NormalizedNote } from "../shared/types";
import { cleanNoteDisplayText } from "../shared/textCleanup";
import { extractVisibleMetrics } from "../shared/visibleMetrics";
import { findChromeExecutable } from "./browserRuntime";
import type { Collector } from "./types";

function topicsFromTitle(keyword: string, title: string) {
  const hashTopics = [...title.matchAll(/#([\p{Script=Han}\w-]{2,20})/gu)].map((match) => match[1]);
  return [...new Set([keyword, ...hashTopics])].slice(0, 6);
}

export class PublicBrowserCollector implements Collector {
  name = "public-browser";

  async collect(keyword: string, limit: number): Promise<NormalizedNote[]> {
    const executablePath = await findChromeExecutable();
    const browser = await chromium.launch({ headless: true, executablePath });
    const collectedAt = new Date().toISOString();

    try {
      const page = await browser.newPage({
        locale: "zh-CN",
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"
      });
      const target = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`;
      await page.goto(target, { waitUntil: "domcontentloaded", timeout: 25_000 });
      await page.waitForTimeout(5_000);

      const rawNotes = await page.evaluate((maxItems) => {
        const anchors = [...document.querySelectorAll<HTMLAnchorElement>('a[href*="/explore/"]')];
        return anchors.slice(0, maxItems * 3).map((anchor) => {
          const container = anchor.closest("section, div, article") ?? anchor;
          const text = (container.textContent ?? anchor.textContent ?? "").replace(/\s+/g, " ").trim();
          return {
            href: anchor.href,
            anchorText: (anchor.textContent ?? "").replace(/\s+/g, " ").trim(),
            text
          };
        });
      }, limit);

      const notes: NormalizedNote[] = [];
      const seen = new Set<string>();

      for (const [index, raw] of rawNotes.entries()) {
        if (notes.length >= limit) break;
        if (!raw.href || seen.has(raw.href)) continue;
        const title = cleanNoteDisplayText((raw.anchorText || raw.text).slice(0, 100));
        if (title.length < 4) continue;
        seen.add(raw.href);

        const metrics = extractVisibleMetrics(raw.text);
        const { likes, collects, comments } = metrics;
        const hasAnyMetric = likes !== undefined || collects !== undefined || comments !== undefined;

        notes.push({
          id: `browser-${keyword}-${index}-${Buffer.from(raw.href).toString("base64url").slice(0, 10)}`,
          keyword,
          title,
          summary: cleanNoteDisplayText(raw.text.slice(0, 180)),
          topics: topicsFromTitle(keyword, raw.text),
          url: raw.href,
          author: "公开页面",
          publishedAt: null,
          metrics,
          source: "public-browser",
          collectedAt,
          completeness: hasAnyMetric ? 0.72 : 0.5
        });
      }

      return notes;
    } finally {
      await browser.close();
    }
  }
}
