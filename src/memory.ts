export interface MemoryFileSystem {
  cwd(): string;
  access(path: string): Promise<void>;
  mkdir(path: string, options: { recursive: boolean }): Promise<void>;
  writeFile(path: string, content: string | Uint8Array): Promise<void>;
  snapshot(): Record<string, string | Uint8Array>;
}

export function createMemoryFs(initial?: Record<string, string | Uint8Array>): MemoryFileSystem {
  const store = new Map(Object.entries(initial ?? {}));

  return {
    cwd: () => "/",
    access: async (path: string) => {
      if (!store.has(path)) throw new Error(`File not found: ${path}`);
    },
    mkdir: async (_path: string, _opts: { recursive: boolean }) => {},
    writeFile: async (path: string, content: string | Uint8Array) => {
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
