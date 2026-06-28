import { dirname, join } from "node:path";
import type { VirtualFile } from "./protocol.js";
import { mkdir, writeFile } from "node:fs/promises";

const MAX_CONCURRENCY = 50;

async function runConcurrently<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  limit: number,
): Promise<void> {
  const queue = items.slice();
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (index < queue.length) {
      await fn(queue[index++]);
    }
  });
  await Promise.all(workers);
}

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
export async function write(files: VirtualFile[], options: WriteOptions = {}): Promise<void> {
  if (files.length === 0) return;

  const base = options.targetDir || process.cwd();

  const dirs = new Set<string>();
  const absFiles: { path: string; content: string | Uint8Array }[] = [];

  for (let i = 0; i < files.length; i++) {
    const abs = join(base, files[i].path);
    dirs.add(dirname(abs));
    absFiles.push({ path: abs, content: files[i].content });
  }

  await Promise.all(Array.from(dirs, (d) => mkdir(d, { recursive: true })));
  await runConcurrently(absFiles, (f) => writeFile(f.path, f.content), MAX_CONCURRENCY);
}
