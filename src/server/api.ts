import { createServer } from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { loadConfig, type AppConfig } from "../config/loadConfig";
import { runScan } from "../cli/scan";
import { openLoginSession } from "../collectors/loginSession";
import { handleOptions, readJsonBody, sendJson, sendText } from "../shared/http";

interface KeywordsBody {
  keywords?: string[];
}

let scanInProgress: Promise<unknown> | null = null;

function cleanKeywords(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => String(item).trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index)
    .slice(0, 5);
}

async function saveConfig(config: AppConfig) {
  await fs.mkdir("config", { recursive: true });
  await fs.writeFile("config/keywords.yml", yaml.dump(config, { lineWidth: 120 }), "utf8");
}

async function readLatestRun() {
  const raw = await fs.readFile(path.resolve("public/latest-run.json"), "utf8");
  return JSON.parse(raw);
}

async function readLatestReport() {
  return fs.readFile(path.resolve("public/latest-report.md"), "utf8");
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "OPTIONS") {
      handleOptions(response);
      return;
    }

    const url = new URL(request.url ?? "/", "http://127.0.0.1:8787");

    if (request.method === "GET" && url.pathname === "/api/config") {
      sendJson(response, 200, await loadConfig());
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/config") {
      const body = await readJsonBody<KeywordsBody>(request);
      const keywords = cleanKeywords(body?.keywords);
      if (keywords.length === 0) {
        sendJson(response, 400, { error: "至少需要 1 个关键词" });
        return;
      }
      const config = await loadConfig();
      config.keywords = keywords;
      await saveConfig(config);
      sendJson(response, 200, config);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/run") {
      sendJson(response, 200, await readLatestRun());
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/login/open") {
      sendJson(response, 200, await openLoginSession());
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/report") {
      sendText(response, 200, await readLatestReport(), "text/markdown; charset=utf-8");
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/scan") {
      const body = await readJsonBody<KeywordsBody>(request);
      const config = await loadConfig();
      const keywords = cleanKeywords(body?.keywords);
      if (keywords.length > 0) {
        config.keywords = keywords;
        await saveConfig(config);
      }

      if (scanInProgress) {
        sendJson(response, 409, { error: "扫描正在进行中，请稍后刷新结果。" });
        return;
      }

      scanInProgress = runScan(config).finally(() => {
        scanInProgress = null;
      });
      const run = await scanInProgress;
      sendJson(response, 200, run);
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendJson(response, 500, { error: message });
  }
});

server.listen(8787, "127.0.0.1", () => {
  console.log("XHS Trend Radar API: http://127.0.0.1:8787");
});
