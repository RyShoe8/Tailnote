/** Public vCard download URL for an employee preview token. */
export function vcardDownloadUrl(origin: string, previewToken: string): string {
  const base = origin.replace(/\/+$/, '');
  const token = previewToken.trim();
  return `${base}/api/vcard/${encodeURIComponent(token)}`;
}
