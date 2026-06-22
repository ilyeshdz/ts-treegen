import { normalize, resolve } from "node:path";

export function sanitizePath(basePath: string, segment: string): string {
  if (segment.startsWith("/")) {
    throw new Error(`Directory traversal or absolute path violation: ${segment}`);
  }

  const combined = normalize(basePath ? `${basePath}/${segment}` : segment);
  
  if (combined.startsWith("..")) {
    throw new Error(`Directory traversal or absolute path violation: ${segment}`);
  }
  
  if (basePath) {
    const baseNormalized = normalize(basePath);
    const resolvedBase = resolve("/", baseNormalized);
    const resolvedCombined = resolve("/", combined);
    
    if (!resolvedCombined.startsWith(resolvedBase + "/") && resolvedCombined !== resolvedBase) {
      throw new Error(`Directory traversal or absolute path violation: ${segment}`);
    }
  }
  
  return combined;
}
