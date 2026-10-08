/** Runtime-agnostic filesystem interface for the write plan. */
export interface FileSystem {
  cwd(): string;
  exists(path: string): Promise<boolean>;
  mkdir(path: string, options: { recursive: boolean }): Promise<void>;
  writeFile(path: string, content: string | Uint8Array): Promise<void>;
  /**
   * Create a symbolic link. Optional — only required when the plan
   * contains {@link link} entries. Missing support fails fast at run-time.
   */
  symlink?(target: string, path: string): Promise<void>;
  /**
   * Change file mode bits. Optional — only required when the plan
   * contains files with a `mode`. Missing support fails fast at run-time.
   */
  chmod?(path: string, mode: number): Promise<void>;
}

/** Internal brand symbol used to identify PlateNodes at runtime. */
export const PLATE_SYMBOL = Symbol.for("ts-plate.node");

/** A resolved file ready for disk serialization. */
export interface VirtualFile {
  /** Relative path from the target directory. */
  path: string;
  /** String or binary content. Ignored when `symlink` is set. */
  content: string | Uint8Array;
  /**
   * Symlink target. When set, the entry is created as a symbolic link
   * instead of a regular file.
   */
  symlink?: string;
  /**
   * File mode bits (e.g. `0o755`). Applied with chmod after writing.
   * Only set via the `file()` options.
   */
  mode?: number;
}

/** Options for {@link file}. */
export interface FileOptions {
  /**
   * File mode bits (e.g. `0o755` for executables).
   * Requires the `FileSystem` to implement `chmod()`.
   */
  mode?: number;
}

/**
 * Union of accepted content types for {@link file}.
 *
 * - `string` / `Uint8Array` – literal content.
 * - `Record<string, unknown>` – serialised to pretty-printed JSON.
 * - `() => FileContentValue | Promise<FileContentValue>` – lazy factory evaluated once per generation.
 *   `null` / `undefined` results are coerced to an empty string.
 */
type FileContentValue = string | Uint8Array | Record<string, unknown> | null | undefined;

export type FileContent = FileContentValue | (() => FileContentValue | Promise<FileContentValue>);

/** A node in a virtual file-tree that can produce one or more {@link VirtualFile} entries. */
export interface PlateNode {
  [PLATE_SYMBOL]: true;
  /**
   * Returns all {@link VirtualFile} entries reachable from this node given
   * the accumulated path prefix so far.
   * @param currentPath – Normalised path inherited from ancestor directories.
   */
  generate(currentPath: string): Promise<VirtualFile[]>;
}
