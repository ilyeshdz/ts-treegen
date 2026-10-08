import { describe, it, expect } from "vitest";
import { file, link, emit, plan } from "../src/index.js";
import { createMemoryFs } from "../src/memory.js";

describe("onConflict", () => {
  it("should keep the last entry by default", async () => {
    const p = await plan(await emit(file("a.txt", "first"), file("a.txt", "second")), {
      targetDir: "/",
    });
    expect(p.files).toHaveLength(1);
    expect(p.files[0].content).toBe("second");
  });

  it("should deterministically write the last entry", async () => {
    const fs = createMemoryFs();
    const target = await plan(await emit(file("a.txt", "first"), file("a.txt", "second")), {
      targetDir: "/",
      fs,
    });
    for (let i = 0; i < 5; i++) {
      await target.run();
    }
    expect(fs.snapshot()).toEqual({ "/a.txt": "second" });
  });

  it("should keep the first entry with onConflict: first", async () => {
    const p = await plan(await emit(file("a.txt", "first"), file("a.txt", "second")), {
      targetDir: "/",
      onConflict: "first",
    });
    expect(p.files).toHaveLength(1);
    expect(p.files[0].content).toBe("first");
  });

  it("should preserve order of first occurrence", async () => {
    const p = await plan(await emit(file("b.txt", "b1"), file("a.txt", "a"), file("b.txt", "b2")), {
      targetDir: "/",
      onConflict: "last",
    });
    expect(p.files.map((f) => f.path)).toEqual(["b.txt", "a.txt"]);
    expect(p.files[0].content).toBe("b2");
  });

  it("should throw listing every duplicated path with onConflict: error", async () => {
    const files = await emit(
      file("a.txt", "1"),
      file("b.txt", "1"),
      file("a.txt", "2"),
      file("b.txt", "2"),
      file("a.txt", "3"),
    );
    await expect(plan(files, { targetDir: "/", onConflict: "error" })).rejects.toThrow(
      "Duplicate paths in plan: a.txt, b.txt",
    );
  });

  it("should leave unique plans untouched", async () => {
    const p = await plan(await emit(file("a.txt", "a"), file("b.txt", "b")), {
      targetDir: "/",
      onConflict: "error",
    });
    expect(p.files).toHaveLength(2);
  });

  it("should treat a file and a link at the same path as a conflict", async () => {
    const p = await plan(await emit(file("item", "content"), link("item", "target")), {
      targetDir: "/",
    });
    expect(p.files).toHaveLength(1);
    expect(p.files[0].symlink).toBe("target");
  });

  it("should carry the winner mode", async () => {
    const fs = createMemoryFs();
    const p = await plan(
      await emit(file("run.sh", "old"), file("run.sh", "new", { mode: 0o755 })),
      { targetDir: "/", fs },
    );
    await p.run();
    expect(fs.snapshot()).toEqual({ "/run.sh": "new" });
    expect(fs.getMode("/run.sh")).toBe(0o755);
  });
});
