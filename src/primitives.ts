import {
  PLATE_SYMBOL,
  type PlateNode,
  type VirtualFile,
  type FileContent,
  type FileOptions,
} from "./protocol.js";
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
 * @param options – Optional settings (e.g. `{ mode: 0o755 }` for executables).
 */
export function file(name: string, content?: FileContent, options?: FileOptions): PlateNode {
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

      const entry: VirtualFile = { path: resolvedPath, content: finalContent };
      if (options?.mode !== undefined) {
        entry.mode = options.mode;
      }
      return [entry];
    },
  };
}

/**
 * Create a virtual symbolic link node.
 *
 * Only the link location is validated — the target is stored verbatim
 * and may be relative (e.g. `"../shared/util.sh"`) or absolute,
 * since pointing outside the tree is the purpose of a symlink.
 *
 * @param name – Relative link path (e.g. `"bin/tool"`).
 * @param target – Link target as it will appear on disk.
 */
export function link(name: string, target: string): PlateNode {
  return {
    [PLATE_SYMBOL]: true,
    async generate(currentPath) {
      const resolvedPath = sanitizePath(currentPath, name);
      return [{ path: resolvedPath, content: "", symlink: target }];
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
