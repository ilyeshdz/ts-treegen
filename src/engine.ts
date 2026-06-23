import { dir } from "./primitives.js";
import type { VirtualFile } from "./protocol.js";

export async function emit(...nodes: any[]): Promise<VirtualFile[]> {
  const files: VirtualFile[] = [];
  const rootNode = dir("", ...nodes);

  for await (const file of rootNode.generate("")) {
    files.push(file);
  }
  
  return files;
}