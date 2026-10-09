declare var Bun: {
  file(path: string): { exists(): Promise<boolean> };
  write(path: string, content: string | Uint8Array | Blob): Promise<number>;
};

export { PLATE_SYMBOL } from "./protocol.js";
export { file, dir, link } from "./primitives.js";
export { emit } from "./engine.js";
export type { PlateNode, VirtualFile, FileContent, FileOptions, FileSystem } from "./protocol.js";
export type { Plan, PlanFile, PlanOptions, PlanProgress, ConflictStrategy } from "./plan.js";

import { plan as planCore } from "./plan.js";
import type { VirtualFile, FileSystem } from "./protocol.js";
import type { Plan, PlanOptions } from "./plan.js";
import { mkdir, symlink, chmod } from "node:fs/promises";

const bunFs: FileSystem = {
  cwd: () => process.cwd(),
  exists: async (path: string) => Bun.file(path).exists(),
  mkdir: (path: string, opts: { recursive: boolean }) =>
    mkdir(path, { recursive: opts.recursive }).then(() => {}),
  writeFile: (path: string, content: string | Uint8Array) =>
    Bun.write(path, content).then(() => {}),
  symlink: (target: string, path: string) => symlink(target, path).then(() => {}),
  chmod: (path: string, mode: number) => chmod(path, mode).then(() => {}),
};

export async function plan(files: VirtualFile[], options: PlanOptions = {}): Promise<Plan> {
  return planCore(files, { ...options, fs: bunFs });
}
