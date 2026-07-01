/** Normalize logo URLs for comparison (strip query, hash, trailing slash). */
export function normalizeLogoUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    parsed.hash = '';
    parsed.search = '';
    let normalized = parsed.toString();
    if (parsed.pathname !== '/' && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized.toLowerCase();
  } catch {
    return trimmed.toLowerCase().replace(/\/$/, '');
  }
}
