/**
 * Strip Windows-style backslashes (literal or %5C) from URL paths.
 * Returns a normalized path when changed, or null when no fix is needed.
 */
export function normalizeBackslashPathname(pathname: string): string | null {
  if (!pathname.includes('\\') && !/%5c/i.test(pathname)) {
    return null;
  }

  let normalized = pathname.replace(/\\/g, '').replace(/%5C/gi, '');
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.replace(/\/+$/, '') || '/';
  }

  return normalized === pathname ? null : normalized || '/';
}
