import { dir } from "./primitives.js";
import type { VirtualFile } from "./protocol.js";

export async function emit(...nodes: any[]): Promise<VirtualFile[]> {
  const files: VirtualFile[] = [];
  const rootNode = dir("", ...nodes);

  for await (const file of rootNode.generate("")) {
    if (file.path.split("/").includes("..") || file.path.startsWith("/")) {
      throw new Error(`Directory traversal or absolute path violation: ${file.path}`);
    }
    files.push(file);
  }
  
  return files;
}