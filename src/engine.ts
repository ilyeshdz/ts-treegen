import { dir } from "./primitives.js";
import type { VirtualFile } from "./protocol.js";

/**
 * Compile a list of nodes into a flat array of {@link VirtualFile} objects.
 *
 * All paths are validated and normalised before any result is yielded.
 * Throws on directory-traversal or absolute-path escape attempts.
 *
 * @param nodes – One or more {@link PlateNode}s (e.g. from {@link file} / {@link dir}).
 * @returns Flat array of resolved virtual files.
 */
export async function emit(...nodes: any[]): Promise<VirtualFile[]> {
  const files: VirtualFile[] = [];
  const rootNode = dir("", ...nodes);

  for await (const file of rootNode.generate("")) {
    files.push(file);
  }
  
  return files;
}