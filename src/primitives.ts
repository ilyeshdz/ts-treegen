import { PLATE_SYMBOL, type PlateNode, type FileContent } from "./protocol.js";

export function file(name: string, content: FileContent): PlateNode {
  return {
    [PLATE_SYMBOL]: true,
    async *generate(currentPath) {
      const resolvedPath = currentPath ? `${currentPath}/${name}` : name;
      let finalContent: string | Uint8Array;
      const evaluated = typeof content === "function" ? await content() : content;

      if (evaluated instanceof Uint8Array || typeof evaluated === "string") {
        finalContent = evaluated;
      } else {
        finalContent = JSON.stringify(evaluated, null, 2);
      }

      yield { path: resolvedPath, content: finalContent };
    }
  };
}

export function dir(name: string, ...children: any[]): PlateNode {
  return {
    [PLATE_SYMBOL]: true,
    async *generate(currentPath) {
      const nextPath = name 
        ? (currentPath ? `${currentPath}/${name}` : name)
        : currentPath;
      
      for (const child of children.flat(Infinity)) {
        if (child && child[PLATE_SYMBOL]) {
          yield* child.generate(nextPath);
        }
      }
    }
  };
}