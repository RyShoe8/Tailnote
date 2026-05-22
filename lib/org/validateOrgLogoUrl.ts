/**
 * Org logos must be uploaded via /api/dashboard/organization/logo (Vercel Blob).
 * Path pattern: .../tailnote/orgs/{organizationId}/logos/...
 */
export function isAllowedOrgLogoUrl(url: string, organizationId: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;

  const orgId = organizationId.trim();
  if (!orgId) return false;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const path = decodeURIComponent(parsed.pathname);
    const expectedSegment = `/tailnote/orgs/${orgId}/logos/`;
    return path.includes(expectedSegment);
  } catch {
    return false;
  }
}

export function orgLogoUrlValidationMessage(): string {
  return 'Upload a logo from this page. External image URLs are not supported.';
}
