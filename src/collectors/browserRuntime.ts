import fs from "node:fs/promises";

const candidatePaths = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
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
