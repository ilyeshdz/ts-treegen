import { describe, it, expect } from "vitest";
import { file, link, emit, plan } from "../src/index.js";
import type { PlanProgress } from "../src/index.js";
import { createMemoryFs } from "../src/memory.js";

describe("run onProgress", () => {
  it("should fire once per written file with done and total", async () => {
    const fs = createMemoryFs();
    const p = await plan(await emit(file("a.txt", "a"), file("b.txt", "b"), file("c.txt", "c")), {
      targetDir: "/",
      fs,
    });
    const events: PlanProgress[] = [];
    await p.run(undefined, (e) => {
      events.push(e);
    });

    expect(events).toHaveLength(3);
    expect(events.map((e) => e.done).sort((x, y) => x - y)).toEqual([1, 2, 3]);
    for (let i = 0; i < events.length; i++) {
      expect(events[i].total).toBe(3);
    }
    expect(events.map((e) => e.file.path).sort()).toEqual(["a.txt", "b.txt", "c.txt"]);
  });

  it("should count links in the total", async () => {
    const fs = createMemoryFs();
    const p = await plan(await emit(file("a.txt", "a"), link("shortcut", "a.txt")), {
      targetDir: "/",
      fs,
    });
    const events: PlanProgress[] = [];
    await p.run(undefined, (e) => {
      events.push(e);
    });

    expect(events).toHaveLength(2);
    for (let i = 0; i < events.length; i++) {
      expect(events[i].total).toBe(2);
    }
  });

  it("should exclude skipped entries from the total", async () => {
    const fs = createMemoryFs();
    await fs.writeFile("/existing.txt", "original");
    const p = await plan(await emit(file("existing.txt", "new"), file("fresh.txt", "new")), {
      targetDir: "/",
      overwrite: false,
      fs,
    });
    const events: PlanProgress[] = [];
    await p.run(undefined, (e) => {
      events.push(e);
    });

    expect(events).toHaveLength(1);
    expect(events[0].file.path).toBe("fresh.txt");
    expect(events[0].done).toBe(1);
    expect(events[0].total).toBe(1);
  });

  it("should fire no event when everything is skipped", async () => {
    const fs = createMemoryFs();
    await fs.writeFile("/existing.txt", "original");
    const p = await plan(await emit(file("existing.txt", "new")), {
      targetDir: "/",
      overwrite: false,
      fs,
    });
    let calls = 0;
    await p.run(undefined, () => {
      calls++;
    });
    expect(calls).toBe(0);
  });

  it("should run fine without a callback", async () => {
    const fs = createMemoryFs();
    const p = await plan(await emit(file("a.txt", "a")), { targetDir: "/", fs });
    await p.run();
    expect(fs.snapshot()).toEqual({ "/a.txt": "a" });
  });
});
