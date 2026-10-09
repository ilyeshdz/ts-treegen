import {
  PLATE_SYMBOL,
  type PlateNode,
  type VirtualFile,
  type FileContent,
  type FileOptions,
} from "./protocol.js";
import { sanitizePath } from "./utils.js";

/**
 * Create a virtual file node. Objects are serialised to pretty-printed
 * JSON, factories are evaluated once per run, `null` / `undefined`
 * becomes an empty string.
 *
 * @param name Relative file path (e.g. `"src/index.ts"`).
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
 * Create a virtual symbolic link node. The target is stored verbatim and
 * may point outside the tree — only the link location is validated.
 *
 * @param name Relative link path (e.g. `"bin/tool"`).
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
 * Create a virtual directory node. Arrays are deeply flattened and falsy
 * children dropped, so `isProd && file(...)` works inline. `""` as name
 * creates a transparent root boundary.
 *
 * @param name Directory name, or `""` for a root boundary.
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
