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
  /** Symlink target. When set, the entry is created as a symbolic link. */
  symlink?: string;
  /** File mode bits (e.g. `0o755`). Applied with chmod after writing. */
  mode?: number;
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
    const entry: PlanFile = {
      path: files[i].path,
      absolutePath: abs,
      content: files[i].content,
      status: "write",
    };
    if (files[i].symlink !== undefined) {
      entry.symlink = files[i].symlink;
    }
    if (files[i].mode !== undefined) {
      entry.mode = files[i].mode;
    }
    planFiles.push(entry);
  }

  if (options.overwrite === false && io) {
    await Promise.all(
      planFiles.map(async (f) => {
        if (await io.exists(f.absolutePath)) {
          f.status = "skip";
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

      const pending = planFiles.filter((f) => f.status === "write");
      let needsSymlink = false;
      let needsChmod = false;
      for (let i = 0; i < pending.length; i++) {
        if (pending[i].symlink !== undefined) needsSymlink = true;
        if (pending[i].mode !== undefined) needsChmod = true;
      }
      const symlinkFn = activeFs.symlink;
      const chmodFn = activeFs.chmod;
      if (needsSymlink && !symlinkFn) {
        throw new Error("Plan contains symlinks but the FileSystem does not implement symlink().");
      }
      if (needsChmod && !chmodFn) {
        throw new Error("Plan contains file modes but the FileSystem does not implement chmod().");
      }

      await Promise.all(Array.from(dirs, (d) => activeFs.mkdir(d, { recursive: true })));

      const regular: PlanFile[] = [];
      const links: PlanFile[] = [];
      for (let i = 0; i < pending.length; i++) {
        if (pending[i].symlink === undefined) {
          regular.push(pending[i]);
        } else {
          links.push(pending[i]);
        }
      }

      await runConcurrently(
        regular,
        async (f) => {
          await activeFs.writeFile(f.absolutePath, f.content);
          if (f.mode === undefined || !chmodFn) return;
          await chmodFn(f.absolutePath, f.mode);
        },
        MAX_CONCURRENCY,
      );

      if (links.length === 0) return;
      await runConcurrently(
        links,
        async (f) => {
          if (!symlinkFn || f.symlink === undefined) return;
          await symlinkFn(f.symlink, f.absolutePath);
        },
        MAX_CONCURRENCY,
      );
    },
  };
}
