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

export interface PlanFile {
  path: string;
  absolutePath: string;
  content: string | Uint8Array;
  status: "write" | "skip";
  /** Symlink target. When set, the entry is a symbolic link. */
  symlink?: string;
  /** Mode bits, applied with chmod after writing. */
  mode?: number;
}

export interface PlanProgress {
  file: PlanFile;
  done: number;
  /** Skipped entries excluded. */
  total: number;
}

export interface Plan {
  files: PlanFile[];
  /** Execute the plan. Requires a `FileSystem` when none was passed to {@link plan}. */
  run(fs?: FileSystem, onProgress?: (progress: PlanProgress) => void): Promise<void>;
}

/**
 * Duplicate-path strategy: `"last"` (default, supports base + overrides),
 * `"first"`, or `"error"` which throws listing every duplicated path.
 */
export type ConflictStrategy = "error" | "first" | "last";

export interface PlanOptions {
  /** Base output directory. Required unless `fs.cwd()` is provided. */
  targetDir?: string;
  /** When `false`, existing files are silently skipped. @default true */
  overwrite?: boolean;
  fs?: FileSystem;
  /** @default "last" */
  onConflict?: ConflictStrategy;
}

function resolveConflicts(entries: PlanFile[], strategy: ConflictStrategy): PlanFile[] {
  if (strategy === "error") {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (let i = 0; i < entries.length; i++) {
      if (seen.has(entries[i].path)) {
        dupes.add(entries[i].path);
      } else {
        seen.add(entries[i].path);
      }
    }
    if (dupes.size > 0) {
      throw new Error(`Duplicate paths in plan: ${Array.from(dupes).join(", ")}`);
    }
    return entries;
  }

  const deduped: PlanFile[] = [];
  const indexByPath = new Map<string, number>();
  for (let i = 0; i < entries.length; i++) {
    const existing = indexByPath.get(entries[i].path);
    if (existing === undefined) {
      indexByPath.set(entries[i].path, deduped.length);
      deduped.push(entries[i]);
    } else if (strategy === "last") {
      deduped[existing] = entries[i];
    }
  }
  return deduped;
}

/** Deferred write plan. Needs a `targetDir` or a `FileSystem` with `cwd()`. */
export async function plan(files: VirtualFile[], options: PlanOptions = {}): Promise<Plan> {
  const io = options.fs;
  const base = options.targetDir ?? io?.cwd();
  if (!base) {
    throw new Error("Provide targetDir or a FileSystem with cwd() to plan writes.");
  }

  const dirs = new Set<string>();
  let planFiles: PlanFile[] = [];

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

  planFiles = resolveConflicts(planFiles, options.onConflict ?? "last");

  if (options.overwrite === false && io) {
    // TODO: bound concurrency with runConcurrently for very large trees.
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

    async run(runFs?: FileSystem, onProgress?: (progress: PlanProgress) => void) {
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

      // TODO: bound concurrency with runConcurrently for very large trees.
      await Promise.all(Array.from(dirs, (d) => activeFs.mkdir(d, { recursive: true })));

      const total = pending.length;
      let done = 0;
      function track(f: PlanFile) {
        done++;
        onProgress?.({ file: f, done, total });
      }

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
          if (f.mode !== undefined && chmodFn) {
            await chmodFn(f.absolutePath, f.mode);
          }
          track(f);
        },
        MAX_CONCURRENCY,
      );

      if (links.length === 0) return;
      await runConcurrently(
        links,
        async (f) => {
          if (!symlinkFn || f.symlink === undefined) return;
          await symlinkFn(f.symlink, f.absolutePath);
          track(f);
        },
        MAX_CONCURRENCY,
      );
    },
  };
}
