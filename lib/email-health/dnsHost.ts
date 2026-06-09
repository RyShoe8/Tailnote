/** Relative host/name field for common DNS providers (strip apex domain when present). */
export function dnsHostForProvider(host: string, zoneDomain?: string): string {
  if (host === '@' || !zoneDomain) return host;
  const suffix = `.${zoneDomain}`;
  if (host.endsWith(suffix)) {
    return host.slice(0, -suffix.length);
  }
  return host;
}
