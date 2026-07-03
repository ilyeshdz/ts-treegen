declare var Deno: {
  cwd(): string;
  stat(path: string): Promise<{ isFile: boolean; isDirectory: boolean }>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  writeFile(path: string, data: Uint8Array): Promise<void>;
};

export { PLATE_SYMBOL } from "./protocol.js";
export { file, dir } from "./primitives.js";
export { emit } from "./engine.js";
export type { PlateNode, VirtualFile, FileContent, FileSystem } from "./protocol.js";
export type { Plan, PlanFile, PlanOptions } from "./plan.js";

import { plan as planCore } from "./plan.js";
import type { VirtualFile, FileSystem } from "./protocol.js";
import type { Plan, PlanOptions } from "./plan.js";

const denoFs: FileSystem = {
  cwd: () => Deno.cwd(),
  exists: async (path: string) => {
    try {
      const info = await Deno.stat(path);
      return info.isFile;
    } catch {
      return false;
    }
  },
  mkdir: (path: string, opts: { recursive: boolean }) =>
    Deno.mkdir(path, { recursive: opts.recursive }),
  writeFile: (path: string, content: string | Uint8Array) =>
    Deno.writeFile(path, typeof content === "string" ? new TextEncoder().encode(content) : content),
};

export async function plan(files: VirtualFile[], options: PlanOptions = {}): Promise<Plan> {
  return planCore(files, { ...options, fs: denoFs });
}
