import { PLATE_SYMBOL, type PlateNode, type VirtualFile, type FileContent } from "./protocol.js";
import { sanitizePath } from "./utils.js";

/**
 * Create a virtual file node.
 *
 * The `content` parameter is optional — when omitted the resolved file will
 * have an empty string as its content. Plain objects are automatically
 * serialised to pretty-printed JSON. Pass a factory function for lazy
 * evaluation (it is called once per generation run).
 *
 * @param name – Relative file path (e.g. `"src/index.ts"`).
 * @param content – Optional content (see {@link FileContent}).
 */
export function file(name: string, content?: FileContent): PlateNode {
  return {
    [PLATE_SYMBOL]: true,
    async generate(currentPath) {
      const resolvedPath = sanitizePath(currentPath, name);
      const evaluated = typeof content === "function" ? await content() : content;
      let finalContent: string | Uint8Array;

      if (evaluated === undefined || evaluated === null) {
        finalContent = "";
      } else if (evaluated instanceof Uint8Array || typeof evaluated === "string") {
        finalContent = evaluated;
      } else {
        finalContent = JSON.stringify(evaluated, null, 2);
      }

      return [{ path: resolvedPath, content: finalContent }];
    },
  };
}

/**
 * Create a virtual directory node.
 *
 * Deeply flattens arrays and automatically filters out falsy values,
 * so native JS expressions like `isProd && file(...)` work naturally.
 * Passing an empty string `""` as the name creates a root boundary
 * (useful for merging multiple top-level trees without an extra folder).
 *
 * @param name – Directory name, or `""` for a transparent root boundary.
 * @param children – Nested {@link PlateNode}s or arrays thereof.
 */
export function dir(name: string, ...children: any[]): PlateNode {
  const flatChildren = children.flat(Infinity);
  return {
    [PLATE_SYMBOL]: true,
    async generate(currentPath) {
      const nextPath = name ? sanitizePath(currentPath, name) : currentPath;

      const files: VirtualFile[] = [];
      for (const child of flatChildren) {
        if (child && child[PLATE_SYMBOL]) {
          files.push(...(await child.generate(nextPath)));
        }
      }
      return files;
    },
  };
}
