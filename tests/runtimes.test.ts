import { describe, it, expect } from "vitest";

describe("ts-treegen/deno module structure", () => {
  it("should export all expected values", async () => {
    const mod = await import("../src/deno.js");
    expect(mod.PLATE_SYMBOL).toBeDefined();
    expect(mod.file).toBeDefined();
    expect(mod.dir).toBeDefined();
    expect(mod.emit).toBeDefined();
    expect(mod.plan).toBeDefined();
  });
});

describe("ts-treegen/bun module structure", () => {
  it("should export all expected values", async () => {
    const mod = await import("../src/bun.js");
    expect(mod.PLATE_SYMBOL).toBeDefined();
    expect(mod.file).toBeDefined();
    expect(mod.dir).toBeDefined();
    expect(mod.emit).toBeDefined();
    expect(mod.plan).toBeDefined();
  });
});

describe("ts-treegen/cloudflare module structure", () => {
  it("should export core and memory utilities", async () => {
    const mod = await import("../src/cloudflare.js");
    expect(mod.PLATE_SYMBOL).toBeDefined();
    expect(mod.file).toBeDefined();
    expect(mod.dir).toBeDefined();
    expect(mod.emit).toBeDefined();
    expect(mod.plan).toBeDefined();
    expect(mod.createMemoryFs).toBeDefined();
    // WorkersFileSystem is a type-only export, not a value
  });

  it("should create a memory fs from cloudflare subpath", async () => {
    const { createMemoryFs } = await import("../src/cloudflare.js");
    const fs = createMemoryFs();
    expect(fs.cwd()).toBe("/");
  });
});
