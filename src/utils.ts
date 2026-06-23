import { normalize, resolve } from "node:path";

/**
 * Resolve and validate a path segment against a base path.
 *
 * Guards against:
 * - Absolute path segments (e.g. `"/etc/passwd"`).
 * - Directory traversal (e.g. `"../../etc"`).
 * - Escaping the base boundary via symlink-like resolution tricks.
 *
 * @param basePath – Normalised parent path (may be empty).
 * @param segment – Child path segment to resolve.
 * @returns Normalised combined path.
 */
export function sanitizePath(basePath: string, segment: string): string {
  if (segment.startsWith("/") || /^[A-Za-z]:[/\\]/.test(segment) || segment.startsWith("\\\\")) {
    throw new Error(`Directory traversal or absolute path violation: ${segment}`);
  }

  const combined = normalize(basePath ? `${basePath}/${segment}` : segment);

  if (combined === ".." || combined.startsWith("../")) {
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
