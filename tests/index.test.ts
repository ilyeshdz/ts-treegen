import { describe, it, expect } from "vitest";
import { file, dir, emit } from "../src/index.js";
import { sanitizePath } from "../src/utils.js";

describe("ts-plate v0.1.0 engine core", () => {
  it("should compile a basic flat file layout", async () => {
    const layout = await emit(
      file("README.md", "# Hello World")
    );
    expect(layout).toEqual([
      { path: "README.md", content: "# Hello World" }
    ]);
  });

  it("should handle nested directories and handle native JS array filtering", async () => {
    const isProd = false;
    const layout = await emit(
      dir("src",
        file("index.js", "console.log(1)"),
        isProd && file("analytics.js", "track()")
      )
    );
    expect(layout).toEqual([
      { path: "src/index.js", content: "console.log(1)" }
    ]);
  });

  it("should protect against directory traversal breakout paths", async () => {
    const maliciousNode = file("../etc/passwd", "malicious payload");
    await expect(emit(maliciousNode)).rejects.toThrow();
  });
});

describe("sanitizePath utility function", () => {
  it("should normalize and combine valid paths", () => {
    const result = sanitizePath("src", "components");
    expect(result).toBe("src/components");
  });

  it("should handle empty basePath", () => {
    const result = sanitizePath("", "file.ts");
    expect(result).toBe("file.ts");
  });

  it("should reject paths starting with ..", () => {
    expect(() => sanitizePath("src", "../etc/passwd")).toThrow(
      "Directory traversal or absolute path violation: ../etc/passwd"
    );
  });

  it("should reject absolute paths", () => {
    expect(() => sanitizePath("src", "/etc/passwd")).toThrow(
      "Directory traversal or absolute path violation: /etc/passwd"
    );
  });

  it("should resolve redundant slashes", () => {
    const result = sanitizePath("src//utils", "./helpers");
    expect(result).toBe("src/utils/helpers");
  });

  it("should throw for directory traversal in nested paths", () => {
    expect(() => sanitizePath("src/components", "../../etc/passwd")).toThrow();
  });

  it("should handle normal nested paths", () => {
    const result = sanitizePath("src/views", "admin/dashboard.tsx");
    expect(result).toBe("src/views/admin/dashboard.tsx");
  });
});