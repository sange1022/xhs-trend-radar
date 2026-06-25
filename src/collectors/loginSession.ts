import path from "node:path";
import { chromium, type BrowserContext } from "playwright";
import { findChromeExecutable } from "./browserRuntime";

let context: BrowserContext | null = null;

export async function openLoginSession() {
  if (!context) {
    const executablePath = await findChromeExecutable();
    context = await chromium.launchPersistentContext(path.resolve(".xhs-login-profile"), {
      executablePath,
      headless: false,
      viewport: { width: 1280, height: 900 },
      locale: "zh-CN",
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    });
  }

  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto("https://www.xiaohongshu.com", { waitUntil: "domcontentloaded", timeout: 30_000 });
  return {
    status: "opened",
    message: "登录窗口已打开。请在弹出的 Chrome 里完成小红书登录，然后回到看板点击立即扫描。"
  };
}

export function getLoginContext() {
  return context;
}

export async function closeLoginSession() {
  await context?.close();
  context = null;
}
