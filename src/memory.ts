export interface MemoryFileSystem {
  cwd(): string;
  exists(path: string): Promise<boolean>;
  mkdir(path: string, options: { recursive: boolean }): Promise<void>;
  writeFile(path: string, content: string | Uint8Array): Promise<void>;
  snapshot(): Record<string, string | Uint8Array>;
}

export function createMemoryFs(initial?: Record<string, string | Uint8Array>): MemoryFileSystem {
  const store = new Map(Object.entries(initial ?? {}));
  const dirs = new Set<string>(["/"]);

  function addDir(path: string) {
    const parts = path.split("/").filter(Boolean);
    let current = "";
    for (const part of parts) {
      current += "/" + part;
      dirs.add(current);
    }
  }

  return {
    cwd: () => "/",
    exists: async (path: string) => store.has(path),
    mkdir: async (path: string, _opts: { recursive: boolean }) => {
      addDir(path);
    },
    writeFile: async (path: string, content: string | Uint8Array) => {
      const parent = path.substring(0, path.lastIndexOf("/")) || "/";
      if (!dirs.has(parent)) {
        const err = new Error(`ENOENT: no such file or directory, open '${path}'`);
        (err as { code?: string }).code = "ENOENT";
        throw err;
      }
      store.set(path, content);
    },
    snapshot: () => Object.fromEntries(store),
  };
}

export { PLATE_SYMBOL } from "./protocol.js";
export { file, dir } from "./primitives.js";
export { emit } from "./engine.js";
export { plan } from "./plan.js";
export type { PlateNode, VirtualFile, FileContent } from "./protocol.js";
export type { Plan, PlanFile, PlanOptions } from "./plan.js";
