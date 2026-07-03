import { describe, it, expect } from "vitest";
import { file, dir, emit, plan } from "../src/index.js";
import { createMemoryFs } from "../src/memory.js";

describe("MemoryFileSystem", () => {
  it("should report cwd as /", () => {
    const fs = createMemoryFs();
    expect(fs.cwd()).toBe("/");
  });

  it("should write and snapshot files", async () => {
    const fs = createMemoryFs();
    await fs.writeFile("/a/b/c.txt", "hello");
    expect(fs.snapshot()).toEqual({ "/a/b/c.txt": "hello" });
  });

  it("should write binary content", async () => {
    const fs = createMemoryFs();
    const bin = new Uint8Array([0xde, 0xad]);
    await fs.writeFile("/data.bin", bin);
    expect(fs.snapshot()["/data.bin"]).toBe(bin);
  });

  it("should resolve access for stored files", async () => {
    const fs = createMemoryFs();
    await fs.writeFile("/exists.txt", "yep");
    await expect(fs.access("/exists.txt")).resolves.toBeUndefined();
  });

  it("should reject access for missing files", async () => {
    const fs = createMemoryFs();
    await expect(fs.access("/nope.txt")).rejects.toThrow("File not found");
  });

  it("mkdir should be a no-op", async () => {
    const fs = createMemoryFs();
    await expect(fs.mkdir("/any/dir", { recursive: true })).resolves.toBeUndefined();
  });

  it("should accept initial state", () => {
    const fs = createMemoryFs({ "/a.txt": "a", "/b.txt": "b" });
    expect(fs.snapshot()).toEqual({ "/a.txt": "a", "/b.txt": "b" });
  });

  it("should clear state from initial on write", async () => {
    const fs = createMemoryFs({ "/a.txt": "old" });
    await fs.writeFile("/a.txt", "new");
    expect(fs.snapshot()).toEqual({ "/a.txt": "new" });
  });

  it("should work as a FileSystem provider for plan", async () => {
    const fs = createMemoryFs();
    const files = await emit(
      file("hello.txt", "world"),
      dir("nested", file("deep.txt", "content")),
    );
    const p = await plan(files, { targetDir: "/", fs });
    await p.run();

    expect(fs.snapshot()).toEqual({
      "/hello.txt": "world",
      "/nested/deep.txt": "content",
    });
  });

  it("should support overwrite: false with check at plan-time", async () => {
    const fs = createMemoryFs();
    await fs.writeFile("/existing.txt", "original");
    await plan(await emit(file("existing.txt", "overwritten"), file("new.txt", "new")), {
      targetDir: "/",
      overwrite: false,
      fs,
    }).then(async (p) => {
      expect(p.files[0].status).toBe("skip");
      expect(p.files[1].status).toBe("write");
      await p.run();
    });

    expect(fs.snapshot()["/existing.txt"]).toBe("original");
    expect(fs.snapshot()["/new.txt"]).toBe("new");
  });
});
