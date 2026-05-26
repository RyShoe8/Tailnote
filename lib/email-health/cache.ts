export const EMAIL_HEALTH_CACHE_MS = 24 * 60 * 60 * 1000;

export function isScanFresh(scannedAt: Date, now = new Date()): boolean {
  return now.getTime() - scannedAt.getTime() < EMAIL_HEALTH_CACHE_MS;
}
