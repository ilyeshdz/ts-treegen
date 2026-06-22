import { describe, it, expect } from "vitest";
import { file, dir, emit } from "../src/index.js";

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