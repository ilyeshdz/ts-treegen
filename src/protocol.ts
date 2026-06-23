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
 * - `Record<string, any>` – serialised to pretty-printed JSON.
 * - `() => any | Promise<any>` – lazy factory evaluated once per generation.
 *   `null` / `undefined` results are coerced to an empty string.
 */
export type FileContent = string | Uint8Array | Record<string, any> | (() => any | Promise<any>);

/** A node in a virtual file-tree that can produce one or more {@link VirtualFile} entries. */
export interface PlateNode {
  [PLATE_SYMBOL]: true;
  /**
   * Yields all {@link VirtualFile} entries reachable from this node given
   * the accumulated path prefix so far.
   * @param currentPath – Normalised path inherited from ancestor directories.
   */
  generate(currentPath: string): AsyncGenerator<VirtualFile, void, unknown>;
}