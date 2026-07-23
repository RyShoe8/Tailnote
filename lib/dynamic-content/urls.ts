import { getAppBaseUrl } from '@/lib/email/appUrl';

/** Permanent Dynamic Content image URL (bytes change; path does not). */
export function stableContentImageUrl(contentSourceId: string): string {
  const base = getAppBaseUrl().replace(/\/$/, '');
  return `${base}/api/content-images/${contentSourceId}.png`;
}
