function normalizePath(p: string): string {
  const parts = p.split("/");
  const result: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === "" || part === ".") continue;
    if (part === "..") {
      if (result.length > 0 && result[result.length - 1] !== "..") {
        result.pop();
      } else {
        result.push("..");
      }
    } else {
      result.push(part);
    }
  }
  return result.join("/") || ".";
}

export function dirname(p: string): string {
  const i = p.lastIndexOf("/");
  if (i === -1) return ".";
  if (i === 0) return "/";
  return p.slice(0, i);
}

export function join(...parts: string[]): string {
  return parts.filter(Boolean).join("/");
}

export function sanitizePath(basePath: string, segment: string): string {
  if (segment.startsWith("/") || /^[A-Za-z]:[/\\]/.test(segment) || segment.startsWith("\\\\")) {
    throw new Error(`Directory traversal or absolute path violation: ${segment}`);
  }

  const combined = normalizePath(basePath ? `${basePath}/${segment}` : segment);

  if (combined === ".." || combined.startsWith("../")) {
    throw new Error(`Directory traversal or absolute path violation: ${segment}`);
  }

  if (basePath) {
    const baseNormalized = normalizePath(basePath);
    if (!combined.startsWith(baseNormalized + "/") && combined !== baseNormalized) {
      throw new Error(`Directory traversal or absolute path violation: ${segment}`);
    }
  }

  return combined;
}
