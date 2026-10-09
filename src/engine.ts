import { dir } from "./primitives.js";
import type { PlateNode, VirtualFile } from "./protocol.js";

/**
 * Compile nodes into a flat array of {@link VirtualFile}. Paths are
 * validated first — traversal or absolute-path escapes throw.
 */
export async function emit(...nodes: PlateNode[]): Promise<VirtualFile[]> {
  if (nodes.length === 0) return [];
  const rootNode = dir("", ...nodes);
  return rootNode.generate("");
}
