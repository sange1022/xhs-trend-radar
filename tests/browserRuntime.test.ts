import { describe, expect, it } from "vitest";
import { findChromeExecutable } from "../src/collectors/browserRuntime";

describe("findChromeExecutable", () => {
  it("returns a system Chrome executable when bundled Playwright browser is unavailable", async () => {
    const executable = await findChromeExecutable();

    expect(executable).toContain("Chrome");
  });
});
