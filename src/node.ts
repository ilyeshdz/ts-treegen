export { PLATE_SYMBOL } from "./protocol.js";
export { file, dir } from "./primitives.js";
export { emit } from "./engine.js";
export type { PlateNode, VirtualFile, FileContent, FileSystem } from "./protocol.js";
export type { Plan, PlanFile, PlanOptions } from "./plan.js";

import { plan as planCore } from "./plan.js";
import type { VirtualFile, FileSystem } from "./protocol.js";
import type { Plan, PlanOptions } from "./plan.js";
import { access, mkdir, writeFile } from "node:fs/promises";
import { cwd } from "node:process";

const nodeFs: FileSystem = {
  cwd,
  access,
  mkdir: (p, o) => mkdir(p, o).then(() => {}),
  writeFile,
};

export async function plan(files: VirtualFile[], options: PlanOptions = {}): Promise<Plan> {
  return planCore(files, { ...options, fs: nodeFs });
}
