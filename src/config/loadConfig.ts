import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";

export interface AppConfig {
  keywords: string[];
  scan: {
    limitPerKeyword: number;
    mode: "public";
    enableLoginCollector: boolean;
    enableBrowserCollector: boolean;
    enableSearchFallback: boolean;
    preciseMode: boolean;
    detailLimitPerKeyword: number;
    schedule: {
      enabled: boolean;
      time: string;
    };
  };
}

const defaultConfig: AppConfig = {
  keywords: ["护肤"],
  scan: {
    limitPerKeyword: 20,
    mode: "public",
    enableLoginCollector: true,
    enableBrowserCollector: true,
    enableSearchFallback: true,
    preciseMode: true,
    detailLimitPerKeyword: 20,
    schedule: {
      enabled: false,
      time: "09:00"
    }
  }
};

export async function loadConfig(configPath = path.resolve("config/keywords.yml")): Promise<AppConfig> {
  try {
    const raw = await fs.readFile(configPath, "utf8");
    const parsed = yaml.load(raw) as Partial<AppConfig> | null;

    return {
      ...defaultConfig,
      ...parsed,
      keywords: (parsed?.keywords ?? defaultConfig.keywords).slice(0, 5),
      scan: {
        ...defaultConfig.scan,
        ...parsed?.scan,
        schedule: {
          ...defaultConfig.scan.schedule,
          ...parsed?.scan?.schedule
        }
      }
    };
  } catch {
    return defaultConfig;
  }
}
