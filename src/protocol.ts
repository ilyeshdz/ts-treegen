/** Internal brand symbol used to identify PlateNodes at runtime. */
export const PLATE_SYMBOL = Symbol.for("ts-plate.node");

/** A resolved file ready for disk serialization. */
export interface VirtualFile {
  /** Relative path from the target directory. */
  path: string;
  /** String or binary content. */
  content: string | Uint8Array;
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
