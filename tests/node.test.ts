import { describe, it, expect } from "vitest";
import { file, dir, emit, plan } from "../src/node.js";
import { mkdtempSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { rm } from "fs/promises";

describe("ts-treegen/node", () => {
  it("should write files without explicit fs option", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "ts-treegen-node-"));
    try {
      const files = await emit(
        file("hello.txt", "world"),
        dir("nested", file("deep.txt", "content")),
      );
      const p = await plan(files, { targetDir: tmpDir });
      await p.run();

      expect(existsSync(join(tmpDir, "hello.txt"))).toBe(true);
      expect(readFileSync(join(tmpDir, "hello.txt"), "utf-8")).toBe("world");
      expect(existsSync(join(tmpDir, "nested/deep.txt"))).toBe(true);
      expect(readFileSync(join(tmpDir, "nested/deep.txt"), "utf-8")).toBe("content");
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("should handle overwrite: false with auto-wired fs", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "ts-treegen-node-"));
    try {
      const p1 = await plan(await emit(file("keep.txt", "original"), file("new.txt", "new")), {
        targetDir: tmpDir,
        overwrite: false,
      });
      await p1.run();

      const p2 = await plan(
        await emit(file("keep.txt", "overwritten"), file("also-new.txt", "also-new")),
        { targetDir: tmpDir, overwrite: false },
      );

      expect(p2.files[0].status).toBe("skip");
      expect(p2.files[1].status).toBe("write");
      await p2.run();

      expect(readFileSync(join(tmpDir, "keep.txt"), "utf-8")).toBe("original");
      expect(existsSync(join(tmpDir, "also-new.txt"))).toBe(true);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("should re-export core types and functions", async () => {
    const files = await emit(file("test.txt", "abc"));
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe("test.txt");
  });
});
