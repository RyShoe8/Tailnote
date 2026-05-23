const LEGACY_ORG_SLUG_INDEX_MESSAGE =
  'A legacy organizations slug index is still present in this database.';

export function isLegacyOrganizationSlugIndexError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: number; message?: string; keyPattern?: Record<string, unknown> };
  if (e.code !== 11000) return false;
  if (e.keyPattern && 'slug' in e.keyPattern) return true;
  const message = String(e.message ?? '').toLowerCase();
  return message.includes('slug_1') || message.includes('dup key') && message.includes('slug');
}

export function legacyOrganizationSlugIndexMessage(): string {
  return LEGACY_ORG_SLUG_INDEX_MESSAGE;
}

export function mapLegacyOrganizationSlugIndexError(err: unknown): Error | null {
  if (!isLegacyOrganizationSlugIndexError(err)) return null;
  return new Error(LEGACY_ORG_SLUG_INDEX_MESSAGE);
}
