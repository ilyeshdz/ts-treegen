import { dirname, join } from "./utils.js";
import type { VirtualFile, FileSystem } from "./protocol.js";

const MAX_CONCURRENCY = 50;

async function runConcurrently<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  limit: number,
): Promise<void> {
  let index = 0;
  let aborted = false;
  const errors: unknown[] = [];
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length && !aborted) {
      const i = index++;
      try {
        await fn(items[i]);
      } catch (e) {
        errors.push(e);
        aborted = true;
        break;
      }
    }
  });
  await Promise.all(workers);
  if (errors.length > 0) {
    throw errors[0];
  }
}

/** A resolved file in the plan, with its absolute path and status. */
export interface PlanFile {
  path: string;
  absolutePath: string;
  content: string | Uint8Array;
  status: "write" | "skip";
}

/** A deferred write plan returned by {@link plan}. */
export interface Plan {
  files: PlanFile[];
  /**
   * Execute the plan. Requires a {@link FileSystem} if one was not
   * provided to {@link plan} via `PlanOptions.fs`.
   */
  run(fs?: FileSystem): Promise<void>;
}

/** Options for {@link plan}. */
export interface PlanOptions {
  /** Base output directory. Required unless `fs.cwd()` is provided. */
  targetDir?: string;
  /**
   * When `false` and a `FileSystem` is available at plan-time,
   * existing files are silently skipped.
   * @default true
   */
  overwrite?: boolean;
  /** A {@link FileSystem} implementation for I/O operations. */
  fs?: FileSystem;
}

/**
 * Create a deferred write plan.
 *
 * Provide a {@link FileSystem} via `options.fs` or pass one to
 * {@link Plan.run} when you're ready to write. At least a
 * `targetDir` or a filesystem with `cwd()` is required.
 *
 * @param files – Array of virtual files to write (typically from {@link emit}).
 * @param options – Plan options.
 */
export async function plan(files: VirtualFile[], options: PlanOptions = {}): Promise<Plan> {
  const io = options.fs;
  const base = options.targetDir ?? io?.cwd();
  if (!base) {
    throw new Error("Provide targetDir or a FileSystem with cwd() to plan writes.");
  }

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

  if (options.overwrite === false && io) {
    await Promise.all(
      planFiles.map(async (f) => {
        try {
          await io.access(f.absolutePath);
          f.status = "skip";
        } catch {
          // file doesn't exist — keep as "write"
        }
      }),
    );
  }

  return {
    files: planFiles,

    async run(runFs?: FileSystem) {
      const activeFs = runFs ?? io;
      if (!activeFs) {
        throw new Error("No FileSystem provided. Pass `fs` to plan() or run().");
      }

      await Promise.all(Array.from(dirs, (d) => activeFs.mkdir(d, { recursive: true })));

      const toWrite = planFiles.filter((f) => f.status === "write");
      if (toWrite.length === 0) return;

      await runConcurrently(
        toWrite,
        (f) => activeFs.writeFile(f.absolutePath, f.content),
        MAX_CONCURRENCY,
      );
    },
  };
}
