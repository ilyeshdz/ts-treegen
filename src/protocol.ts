export const PLATE_SYMBOL = Symbol.for("ts-plate.node");

export interface VirtualFile {
  path: string;
  content: string | Uint8Array;
}

export type FileContent = string | Uint8Array | Record<string, any> | (() => any | Promise<any>);

export interface PlateNode {
  [PLATE_SYMBOL]: true;
  generate(currentPath: string): AsyncGenerator<VirtualFile, void, unknown>;
}