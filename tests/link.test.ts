import { describe, it, expect } from "vitest";
import { file, dir, link, emit, plan } from "../src/index.js";
import type { FileSystem } from "../src/index.js";
import { createMemoryFs } from "../src/memory.js";

function minimalFs(): FileSystem {
  const fs = createMemoryFs();
  return {
    cwd: fs.cwd,
    exists: (p) => fs.exists(p),
    mkdir: (p, o) => fs.mkdir(p, o),
    writeFile: (p, c) => fs.writeFile(p, c),
  };
}

describe("link primitive", () => {
  it("should resolve link path and target", async () => {
    const files = await emit(link("bin/tool", "../shared/tool.sh"));
    expect(files).toEqual([{ path: "bin/tool", content: "", symlink: "../shared/tool.sh" }]);
  });

  it("should nest links inside directories", async () => {
    const files = await emit(dir("bin", link("tool", "actual.sh")));
    expect(files[0].path).toBe("bin/tool");
    expect(files[0].symlink).toBe("actual.sh");
  });

  it("should reject traversal in the link location", async () => {
    await expect(emit(link("../evil", "target"))).rejects.toThrow();
    await expect(emit(link("/abs", "target"))).rejects.toThrow();
  });

  it("should allow targets pointing outside the tree", async () => {
    const files = await emit(link("shortcut", "/usr/local/bin/tool"));
    expect(files[0].symlink).toBe("/usr/local/bin/tool");
  });
});

describe("file mode option", () => {
  it("should carry the mode on the resolved entry", async () => {
    const files = await emit(file("bin/run.sh", "echo hi", { mode: 0o755 }));
    expect(files[0].mode).toBe(0o755);
  });

  it("should leave mode undefined by default", async () => {
    const files = await emit(file("plain.txt", "x"));
    expect(files[0].mode).toBeUndefined();
  });
});

describe("plan with links and modes", () => {
  it("should write files, apply modes and create links", async () => {
    const fs = createMemoryFs();
    const files = await emit(
      file("bin/run.sh", "echo hi", { mode: 0o755 }),
      file("README.md", "# hi"),
      link("latest", "bin/run.sh"),
    );
    const p = await plan(files, { targetDir: "/", fs });
    await p.run();

    expect(fs.snapshot()).toEqual({ "/bin/run.sh": "echo hi", "/README.md": "# hi" });
    expect(fs.getMode("/bin/run.sh")).toBe(0o755);
    await expect(fs.readlink("/latest")).resolves.toBe("bin/run.sh");
  });

  it("should skip existing links with overwrite: false", async () => {
    const fs = createMemoryFs();
    await fs.mkdir("/bin", { recursive: true });
    await fs.symlink("old-target", "/shortcut");
    const p = await plan(await emit(link("shortcut", "new-target")), {
      targetDir: "/",
      overwrite: false,
      fs,
    });
    expect(p.files[0].status).toBe("skip");
    await p.run();
    await expect(fs.readlink("/shortcut")).resolves.toBe("old-target");
  });

  it("should fail fast when the FileSystem lacks symlink()", async () => {
    const p = await plan(await emit(link("shortcut", "target")), {
      targetDir: "/",
      fs: minimalFs(),
    });
    await expect(p.run()).rejects.toThrow("does not implement symlink()");
  });

  it("should fail fast when the FileSystem lacks chmod()", async () => {
    const p = await plan(await emit(file("run.sh", "x", { mode: 0o755 })), {
      targetDir: "/",
      fs: minimalFs(),
    });
    await expect(p.run()).rejects.toThrow("does not implement chmod()");
  });
});
