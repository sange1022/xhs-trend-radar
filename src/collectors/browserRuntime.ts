import fs from "node:fs/promises";
import path from "node:path";

function windowsChromeCandidates() {
  const roots = [process.env.LOCALAPPDATA, process.env.PROGRAMFILES, process.env["PROGRAMFILES(X86)"]].filter(Boolean) as string[];
  return roots.flatMap((root) => [
    path.join(root, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(root, "Microsoft", "Edge", "Application", "msedge.exe")
  ]);
}

const candidatePaths = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ...windowsChromeCandidates()
];

async function exists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function findChromeExecutable() {
  for (const candidate of candidatePaths) {
    if (await exists(candidate)) return candidate;
  }
  return undefined;
}
