const ALLOWED_PREFIXES = ['/dashboard', '/onboarding', '/invite', '/join'] as const;

/**
 * Validates an internal post-auth redirect path. Rejects open redirects and malformed paths.
 */
export function sanitizeInternalRedirect(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  if (trimmed.includes('\\') || trimmed.includes('\0')) return null;
  if (/^\/https?:/i.test(trimmed)) return null;

  let path = trimmed;
  try {
    const parsed = new URL(path, 'https://tailnote.local');
    if (parsed.origin !== 'https://tailnote.local') return null;
    path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }

  if (!path.startsWith('/')) return null;
  const pathname = path.split(/[?#]/)[0] ?? path;
  const allowed = ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!allowed) return null;

  return path;
}
