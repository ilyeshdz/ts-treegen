import { dirname, join } from "node:path";
import type { VirtualFile } from "./protocol.js";
import { access, mkdir, writeFile } from "node:fs/promises";

const MAX_CONCURRENCY = 50;

async function runConcurrently<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  limit: number,
): Promise<void> {
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      await fn(items[index++]);
    }
  });
  await Promise.all(workers);
}

/** Whether the file will be written or skipped during execution. */
export type PlanFileStatus = "write" | "skip";

/** A resolved file in the plan, with its absolute path and status. */
export interface PlanFile {
  /** Relative path as defined in the virtual file. */
  path: string;
  /** Absolute path resolved against the target directory. */
  absolutePath: string;
  /** The content to write. */
  content: string | Uint8Array;
  /**
   * Execution outcome.
   * - `"write"` — file will be written to disk.
   * - `"skip"` — file exists on disk and `overwrite` is `false`, so it will be left untouched.
   */
  status: PlanFileStatus;
}

/** A deferred write plan returned by {@link plan}. */
export interface Plan {
  /** Files to process, each tagged with its resolved path and execution status. */
  files: PlanFile[];
  /**
   * Execute the plan.
   * Creates parent directories as needed and writes files with
   * status `"write"` to disk.
   */
  run(): Promise<void>;
}

/** Options for {@link plan}. */
export interface PlanOptions {
  /** Base output directory. Defaults to `process.cwd()`. */
  targetDir?: string;
  /**
   * Whether to overwrite existing files.
   * When `false`, existing files are silently skipped.
   * @default true
   */
  overwrite?: boolean;
}

/**
 * Create a deferred write plan for a set of virtual files.
 *
 * The returned {@link Plan} contains the resolved file metadata and
 * computes each file's execution status (`"write"` or `"skip"`)
 * based on the current disk state and the provided options.
 * Call `.run()` to persist the files to disk.
 *
 * @param files – Array of virtual files to write (typically from {@link emit}).
 * @param options – Plan options.
 */
export async function plan(files: VirtualFile[], options: PlanOptions = {}): Promise<Plan> {
  const base = options.targetDir || process.cwd();

  const dirs = new Set<string>();
  const planFiles: PlanFile[] = [];

  for (let i = 0; i < files.length; i++) {
    const abs = join(base, files[i].path);
    dirs.add(dirname(abs));
    planFiles.push({
      path: files[i].path,
      absolutePath: abs,
      content: files[i].content,
      status: "write",
    });
  }

  if (options.overwrite === false) {
    await Promise.all(
      planFiles.map(async (f) => {
        try {
          await access(f.absolutePath);
          f.status = "skip";
        } catch {
          // file doesn't exist — keep as "write"
        }
      }),
    );
  }

  return {
    files: planFiles,

    async run() {
      await Promise.all(Array.from(dirs, (d) => mkdir(d, { recursive: true })));

      const toWrite = planFiles.filter((f) => f.status === "write");
      if (toWrite.length === 0) return;

      await runConcurrently(toWrite, (f) => writeFile(f.absolutePath, f.content), MAX_CONCURRENCY);
    },
  };
}
