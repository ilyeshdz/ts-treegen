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

export const PLATE_SYMBOL = Symbol.for("ts-plate.node");

export interface VirtualFile {
  /** Relative path from the target directory. */
  path: string;
  /** Ignored when `symlink` is set. */
  content: string | Uint8Array;
  /** Symlink target. When set, the entry is a symbolic link. */
  symlink?: string;
  /** Mode bits, applied with chmod after writing. */
  mode?: number;
}

export interface FileOptions {
  /** Mode bits. Requires a `FileSystem` with `chmod()`. */
  mode?: number;
}

/**
 * Accepted content types for {@link file}: literals, objects (serialised
 * to pretty-printed JSON), or lazy factories. `null` / `undefined`
 * results are coerced to an empty string.
 */
type FileContentValue = string | Uint8Array | Record<string, unknown> | null | undefined;

export type FileContent = FileContentValue | (() => FileContentValue | Promise<FileContentValue>);

export interface PlateNode {
  [PLATE_SYMBOL]: true;
  /** @param currentPath Path prefix inherited from ancestor directories. */
  generate(currentPath: string): Promise<VirtualFile[]>;
}
