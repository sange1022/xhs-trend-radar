import * as cheerio from "cheerio";
import type { NormalizedNote } from "../shared/types";
import type { Collector } from "./types";

function cleanDuckDuckGoUrl(url: string) {
  try {
    const parsed = new URL(url, "https://duckduckgo.com");
    const uddg = parsed.searchParams.get("uddg");
    return uddg ? decodeURIComponent(uddg) : parsed.href;
  } catch {
    return url;
  }
}

function topicsFromText(keyword: string, text: string) {
  const hashTopics = [...text.matchAll(/#([\p{Script=Han}\w-]{2,20})/gu)].map((match) => match[1]);
  const inferred = text
    .split(/[｜|,，。！!？?\s]+/)
    .filter((part) => part.length >= 2 && part.length <= 8 && /[\p{Script=Han}]/u.test(part))
    .filter((part) => !["小红书", "Xiaohongshu", "Rednote"].includes(part))
    .slice(0, 4);
  return [...new Set([keyword, ...hashTopics, ...inferred])].slice(0, 6);
}

export class SearchFallbackCollector implements Collector {
  name = "search-fallback";

  async collect(keyword: string, limit: number): Promise<NormalizedNote[]> {
    const notes = await this.tryCollect(() => this.collectDuckDuckGo(keyword, limit));
    if (notes.length >= Math.min(5, limit)) return notes.slice(0, limit);
    const bingNotes = await this.tryCollect(() => this.collectBing(keyword, limit));
    const byUrl = new Map<string, NormalizedNote>();
    [...notes, ...bingNotes].forEach((note) => {
      if (!byUrl.has(note.url)) byUrl.set(note.url, note);
    });
    return [...byUrl.values()].slice(0, limit);
  }

  private async tryCollect(run: () => Promise<NormalizedNote[]>) {
    try {
      return await run();
    } catch {
      return [];
    }
  }

  private async collectDuckDuckGo(keyword: string, limit: number): Promise<NormalizedNote[]> {
    const query = encodeURIComponent(`site:xiaohongshu.com/explore ${keyword} 小红书`);
    const url = `https://duckduckgo.com/html/?q=${query}`;
    const response = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.5"
      }
    });

    if (!response.ok) {
      throw new Error(`Search fallback failed with HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const collectedAt = new Date().toISOString();
    const notes: NormalizedNote[] = [];

    $(".result").each((index, element) => {
      if (notes.length >= limit) return false;
      const link = $(element).find(".result__a").first();
      const title = link.text().replace(/\s+/g, " ").trim();
      const href = cleanDuckDuckGoUrl(link.attr("href") ?? "");
      const summary = $(element).find(".result__snippet").text().replace(/\s+/g, " ").trim();

      if (!title || !href.includes("xiaohongshu.com")) return;

      notes.push({
        id: `search-${keyword}-${index}-${Buffer.from(href).toString("base64url").slice(0, 10)}`,
        keyword,
        title,
        summary,
        topics: topicsFromText(keyword, `${title} ${summary}`),
        url: href,
        author: "公开搜索结果",
        publishedAt: null,
        metrics: {},
        source: "search-fallback",
        collectedAt,
        completeness: 0.42
      });
    });

    return notes;
  }

  private async collectBing(keyword: string, limit: number): Promise<NormalizedNote[]> {
    const query = encodeURIComponent(`小红书 ${keyword} 爆款 标题 OR 话题`);
    const url = `https://www.bing.com/search?q=${query}`;
    const response = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.5"
      }
    });

    if (!response.ok) {
      throw new Error(`Bing fallback failed with HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const collectedAt = new Date().toISOString();
    const notes: NormalizedNote[] = [];

    $("li.b_algo").each((index, element) => {
      if (notes.length >= limit) return false;
      const link = $(element).find("h2 a").first();
      const href = link.attr("href") ?? "";
      const title = link.text().replace(/\s+/g, " ").trim();
      const summary = $(element).find(".b_caption p").first().text().replace(/\s+/g, " ").trim();
      const combined = `${title} ${summary}`;
      const isRelevant =
        combined.includes(keyword) &&
        (href.includes("xiaohongshu.com") ||
          href.includes("rednote.com") ||
          combined.toLowerCase().includes("xiaohongshu") ||
          combined.includes("小红书"));

      if (!title || !href || !isRelevant) return;

      notes.push({
        id: `bing-${keyword}-${index}-${Buffer.from(href).toString("base64url").slice(0, 10)}`,
        keyword,
        title,
        summary,
        topics: topicsFromText(keyword, `${title} ${summary}`),
        url: href,
        author: "Bing 公开搜索",
        publishedAt: null,
        metrics: {},
        source: "search-fallback",
        collectedAt,
        completeness: 0.38
      });
    });

    return notes;
  }
}
