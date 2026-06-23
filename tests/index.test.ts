import { describe, it, expect } from "vitest";
import { file, dir, emit, write } from "../src/index.js";
import { sanitizePath } from "../src/utils.js";
import { mkdtempSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { rm } from "fs/promises";

describe("ts-treegen core", () => {
  it("should compile a basic flat file layout", async () => {
    const layout = await emit(file("README.md", "# Hello World"));
    expect(layout).toEqual([{ path: "README.md", content: "# Hello World" }]);
  });

  it("should handle multiple top-level files", async () => {
    const layout = await emit(file("a.txt", "aaa"), file("b.txt", "bbb"));
    expect(layout).toHaveLength(2);
    expect(layout).toContainEqual({ path: "a.txt", content: "aaa" });
    expect(layout).toContainEqual({ path: "b.txt", content: "bbb" });
  });

  it("should handle nested directories with native JS array filtering", async () => {
    const isProd = false;
    const layout = await emit(
      dir("src", file("index.js", "console.log(1)"), isProd && file("analytics.js", "track()")),
    );
    expect(layout).toEqual([{ path: "src/index.js", content: "console.log(1)" }]);
  });

  it("should include files when conditional is true", async () => {
    const debug = true;
    const layout = await emit(
      dir("src", file("index.js", "main"), debug && file("debug.js", "debug")),
    );
    expect(layout).toEqual([
      { path: "src/index.js", content: "main" },
      { path: "src/debug.js", content: "debug" },
    ]);
  });

  it("should filter null and undefined children", async () => {
    const layout = await emit(dir("root", file("a.ts", "a"), null, undefined, file("b.ts", "b")));
    expect(layout).toEqual([
      { path: "root/a.ts", content: "a" },
      { path: "root/b.ts", content: "b" },
    ]);
  });

  it("should deeply flatten nested arrays", async () => {
    const files = [file("1.ts", "1"), file("2.ts", "2")];
    const layout = await emit(dir("lib", [files, file("3.ts", "3")]));
    expect(layout).toEqual([
      { path: "lib/1.ts", content: "1" },
      { path: "lib/2.ts", content: "2" },
      { path: "lib/3.ts", content: "3" },
    ]);
  });

  it("should handle deeply nested directory structure", async () => {
    const layout = await emit(
      dir(
        "project",
        dir(
          "src",
          dir("components", file("Button.tsx", "export const Button = () => null")),
          file("index.ts", "export {}"),
        ),
        dir("tests", file("test.ts", "test")),
      ),
    );
    expect(layout).toEqual([
      { path: "project/src/components/Button.tsx", content: "export const Button = () => null" },
      { path: "project/src/index.ts", content: "export {}" },
      { path: "project/tests/test.ts", content: "test" },
    ]);
  });

  it("should protect against directory traversal breakout paths", async () => {
    const maliciousNode = file("../etc/passwd", "malicious payload");
    await expect(emit(maliciousNode)).rejects.toThrow();
  });

  it("should protect against absolute path segments", async () => {
    await expect(emit(file("/etc/passwd", "data"))).rejects.toThrow();
  });

  it("should protect against nested traversal", async () => {
    const layout = emit(dir("safe", file("../../etc/passwd", "evil")));
    await expect(layout).rejects.toThrow();
  });

  it("should use empty string for missing content", async () => {
    const layout = await emit(file("empty.txt"));
    expect(layout).toEqual([{ path: "empty.txt", content: "" }]);
  });

  it("should handle Uint8Array content", async () => {
    const binary = new Uint8Array([0, 1, 2, 255]);
    const layout = await emit(file("binary.bin", binary));
    expect(layout).toEqual([{ path: "binary.bin", content: binary }]);
  });

  it("should auto-serialize objects to pretty-printed JSON", async () => {
    const layout = await emit(file("config.json", { name: "test", version: 1 }));
    expect(layout).toEqual([
      { path: "config.json", content: JSON.stringify({ name: "test", version: 1 }, null, 2) },
    ]);
  });

  it("should evaluate lazy factory functions", async () => {
    const layout = await emit(file("dynamic.txt", () => "lazy value"));
    expect(layout).toEqual([{ path: "dynamic.txt", content: "lazy value" }]);
  });

  it("should await async factory functions", async () => {
    const layout = await emit(file("async.txt", async () => "async value"));
    expect(layout).toEqual([{ path: "async.txt", content: "async value" }]);
  });

  it("should coerce null from lazy factory to empty string", async () => {
    const layout = await emit(file("maybe.txt", () => null));
    expect(layout).toEqual([{ path: "maybe.txt", content: "" }]);
  });

  it("should coerce undefined from lazy factory to empty string", async () => {
    const layout = await emit(file("maybe.txt", () => undefined));
    expect(layout).toEqual([{ path: "maybe.txt", content: "" }]);
  });

  it("should use empty string for root boundary dir", async () => {
    const layout = await emit(
      dir("", dir("src", file("index.ts", "foo")), file("README.md", "# Hi")),
    );
    expect(layout).toEqual([
      { path: "src/index.ts", content: "foo" },
      { path: "README.md", content: "# Hi" },
    ]);
  });
});

describe("sanitizePath utility", () => {
  it("should normalize and combine valid paths", () => {
    expect(sanitizePath("src", "components")).toBe("src/components");
  });

  it("should handle empty basePath", () => {
    expect(sanitizePath("", "file.ts")).toBe("file.ts");
    expect(sanitizePath("", "deep/file.ts")).toBe("deep/file.ts");
  });

  it("should reject paths starting with ..", () => {
    expect(() => sanitizePath("src", "../etc/passwd")).toThrow(
      "Directory traversal or absolute path violation: ../etc/passwd",
    );
  });

  it("should reject absolute Unix paths", () => {
    expect(() => sanitizePath("src", "/etc/passwd")).toThrow(
      "Directory traversal or absolute path violation: /etc/passwd",
    );
  });

  it("should reject absolute Windows paths", () => {
    expect(() => sanitizePath("src", "C:\\etc\\passwd")).toThrow();
    expect(() => sanitizePath("src", "Z:/etc/passwd")).toThrow();
  });

  it("should reject UNC paths", () => {
    expect(() => sanitizePath("src", "\\\\server\\share\\file")).toThrow();
  });

  it("should resolve redundant slashes", () => {
    expect(sanitizePath("src//utils", "./helpers")).toBe("src/utils/helpers");
  });

  it("should throw for directory traversal in nested paths", () => {
    expect(() => sanitizePath("src/components", "../../etc/passwd")).toThrow();
  });

  it("should handle normal nested paths", () => {
    expect(sanitizePath("src/views", "admin/dashboard.tsx")).toBe("src/views/admin/dashboard.tsx");
  });

  it("should reject just .. as a segment", () => {
    expect(() => sanitizePath("src", "..")).toThrow();
  });

  it("should reject segment that traverses back up with ..", () => {
    expect(() => sanitizePath("a/b/c", "d/../../e")).toThrow();
  });

  it("should prevent boundary escape via deep traversal", () => {
    expect(() => sanitizePath("a/b", "../c")).toThrow();
  });
});

describe("write to disk", () => {
  it("should write files to a temp directory", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "ts-treegen-"));
    try {
      const files = await emit(
        file("hello.txt", "world"),
        dir("nested", file("deep.txt", "content")),
      );
      await write(files, { targetDir: tmpDir });

      expect(existsSync(join(tmpDir, "hello.txt"))).toBe(true);
      expect(readFileSync(join(tmpDir, "hello.txt"), "utf-8")).toBe("world");
      expect(existsSync(join(tmpDir, "nested/deep.txt"))).toBe(true);
      expect(readFileSync(join(tmpDir, "nested/deep.txt"), "utf-8")).toBe("content");
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("should default targetDir to cwd when no options given", () => {
    expect(() => write([])).not.toThrow();
  });

  it("should write binary content correctly", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "ts-treegen-"));
    try {
      const binary = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
      const files = await emit(file("data.bin", binary));
      await write(files, { targetDir: tmpDir });

      const written = readFileSync(join(tmpDir, "data.bin"));
      expect([...written]).toEqual([0xde, 0xad, 0xbe, 0xef]);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});
