export interface MemoryFileSystem {
  cwd(): string;
  exists(path: string): Promise<boolean>;
  mkdir(path: string, options: { recursive: boolean }): Promise<void>;
  writeFile(path: string, content: string | Uint8Array): Promise<void>;
  symlink(target: string, path: string): Promise<void>;
  chmod(path: string, mode: number): Promise<void>;
  readlink(path: string): Promise<string>;
  getMode(path: string): number | undefined;
  snapshot(): Record<string, string | Uint8Array>;
}

export function createMemoryFs(initial?: Record<string, string | Uint8Array>): MemoryFileSystem {
  const store = new Map(Object.entries(initial ?? {}));
  const linkStore = new Map<string, string>();
  const modeStore = new Map<string, number>();
  const dirs = new Set<string>(["/"]);

  function addDir(path: string) {
    const parts = path.split("/").filter(Boolean);
    let current = "";
    for (const part of parts) {
      current += "/" + part;
      dirs.add(current);
    }
  }

  function parentDir(path: string): string {
    return path.substring(0, path.lastIndexOf("/")) || "/";
  }

  function enoent(path: string): Error {
    const err = new Error(`ENOENT: no such file or directory, open '${path}'`);
    (err as { code?: string }).code = "ENOENT";
    return err;
  }

  return {
    cwd: () => "/",
    exists: async (path: string) => store.has(path) || linkStore.has(path),
    mkdir: async (path: string, _opts: { recursive: boolean }) => {
      addDir(path);
    },
    writeFile: async (path: string, content: string | Uint8Array) => {
      if (!dirs.has(parentDir(path))) {
        throw enoent(path);
      }
      store.set(path, content);
    },
    symlink: async (target: string, path: string) => {
      if (!dirs.has(parentDir(path))) {
        throw enoent(path);
      }
      linkStore.set(path, target);
    },
    chmod: async (path: string, mode: number) => {
      if (!store.has(path) && !linkStore.has(path)) {
        throw enoent(path);
      }
      modeStore.set(path, mode);
    },
    readlink: async (path: string) => {
      const target = linkStore.get(path);
      if (target === undefined) {
        throw enoent(path);
      }
      return target;
    },
    getMode: (path: string) => modeStore.get(path),
    snapshot: () => Object.fromEntries(store),
  };
}

export { PLATE_SYMBOL } from "./protocol.js";
export { file, dir, link } from "./primitives.js";
export { emit } from "./engine.js";
export { plan } from "./plan.js";
export type { PlateNode, VirtualFile, FileContent, FileOptions } from "./protocol.js";
export type { Plan, PlanFile, PlanOptions, PlanProgress, ConflictStrategy } from "./plan.js";
