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

      if (typeof evaluated === "string") {
        finalContent = evaluated;
      } else if (evaluated === undefined || evaluated === null) {
        finalContent = "";
      } else if (evaluated instanceof Uint8Array) {
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
 * @param children – Nested {@link PlateNode}s, arrays thereof, or falsy values.
 */

function flattenIfNested(arr: unknown[]): unknown[] {
  return arr.some(Array.isArray) ? arr.flat(Infinity) : arr;
}

export function dir(name: string, ...children: unknown[]): PlateNode {
  const flatChildren = flattenIfNested(children);
  return {
    [PLATE_SYMBOL]: true,
    async generate(currentPath) {
      const nextPath = name ? sanitizePath(currentPath, name) : currentPath;

      const files: VirtualFile[] = [];
      for (let i = 0; i < flatChildren.length; i++) {
        const child = flatChildren[i];
        if (child && typeof child === "object" && PLATE_SYMBOL in child) {
          const childFiles = await (child as PlateNode).generate(nextPath);
          for (let j = 0; j < childFiles.length; j++) {
            files.push(childFiles[j]);
          }
        }
      }
      return files;
    },
  };
}
