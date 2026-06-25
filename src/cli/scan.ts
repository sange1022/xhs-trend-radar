import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AppConfig } from "../config/loadConfig";
import { loadConfig } from "../config/loadConfig";
import { collectKeywordCandidates } from "../collectors/collectorPipeline";
import type { Collector } from "../collectors/types";
import { PublicBrowserCollector } from "../collectors/publicBrowserCollector";
import { SearchFallbackCollector } from "../collectors/searchFallbackCollector";
import { LoggedInBrowserCollector } from "../collectors/loggedInBrowserCollector";
import { enrichNotesWithDetails } from "../collectors/detailEnricher";
import { createInsights } from "../insights/createInsights";
import { createMarkdownReport } from "../reporting/markdown";
import { scoreNotes } from "../scoring/score";
import type { NormalizedNote, ScanRun } from "../shared/types";

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function writeJson(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(filePath: string, value: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, value, "utf8");
}

function createCollectors(config: AppConfig) {
  const collectors: Collector[] = [];
  if (config.scan.enableLoginCollector) collectors.push(new LoggedInBrowserCollector());
  if (config.scan.enableBrowserCollector) collectors.push(new PublicBrowserCollector());
  if (config.scan.enableSearchFallback) collectors.push(new SearchFallbackCollector());
  return collectors;
}

export async function runScan(configOverride?: AppConfig): Promise<ScanRun> {
  const config = configOverride ?? (await loadConfig());
  const date = today();
  const generatedAt = new Date().toISOString();
  const runId = `${date}-${Date.now()}`;
  const collectors = createCollectors(config);
  const errors: string[] = [];
  const allNotes: NormalizedNote[] = [];

  for (const keyword of config.keywords) {
    try {
      const notes = await collectKeywordCandidates(keyword, config.scan.limitPerKeyword, collectors);
      if (notes.length === 0) {
        errors.push(`${keyword}: 今日无可用公开结果。`);
      }
      allNotes.push(...notes);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${keyword}: 采集失败 - ${message}`);
    }
  }

  const enrichedNotes = config.scan.preciseMode
    ? await enrichNotesWithDetails(allNotes, Math.min(allNotes.length, config.scan.detailLimitPerKeyword * config.keywords.length))
    : allNotes;
  const scored = scoreNotes(enrichedNotes, new Date(generatedAt));
  const run: ScanRun = {
    runId,
    date,
    generatedAt,
    keywords: config.keywords,
    notes: scored,
    insights: createInsights(config.keywords, scored),
    errors
  };

  const runDir = path.resolve("data/runs", date);
  await writeJson(path.join(runDir, "raw-notes.json"), allNotes);
  await writeJson(path.join(runDir, "enriched-notes.json"), enrichedNotes);
  await writeJson(path.join(runDir, "scored-notes.json"), scored);
  await writeJson(path.resolve("public/latest-run.json"), run);
  const markdown = createMarkdownReport(run);
  await writeText(path.resolve("reports", `${date}.md`), markdown);
  await writeText(path.resolve("public/latest-report.md"), markdown);

  return run;
}

async function main() {
  const run = await runScan();
  console.log(`Scan complete: ${run.notes.length} notes, ${run.errors.length} warnings`);
  console.log(`Dashboard data: public/latest-run.json`);
  console.log(`Report: reports/${run.date}.md`);
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
