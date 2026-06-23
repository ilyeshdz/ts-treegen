import { dirname, join } from "path";
import type { VirtualFile } from "./protocol";
import { mkdir, writeFile } from "fs/promises";

/** Options for {@link write}. */
export interface WriteOptions {
  /** Base output directory. Defaults to `process.cwd()`. */
  targetDir?: string;
}

/**
 * Persist an array of virtual files to disk.
 *
 * Recursively creates parent directories as needed. Uses native
 * `fs/promises` APIs.
 *
 * @param files – Array of virtual files to write (typically from {@link emit}).
 * @param options – Write options.
 */
export async function write(files: VirtualFile[], options: WriteOptions = {}) {
  const base = options.targetDir || process.cwd();

  for (const file of files) {
    const absolutePath = join(base, file.path);

    await mkdir(dirname(absolutePath), {
      recursive: true
    });

    await writeFile(absolutePath, file.content);
  }
}