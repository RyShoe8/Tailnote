import { GMAIL_SETTINGS_URL } from '@/lib/install/gmailSettingsUrl';

/** Opens the native Gmail app (inbox). There is no public deep link to signature settings. */
export const GMAIL_APP_URL = 'googlegmail://';

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const coarse =
    typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 1023px)').matches;
  const ua = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return coarse || ua;
}

/** Full Gmail web settings (General tab). User scrolls to Signature. Works on desktop and mobile browsers. */
export function resolveGmailSettingsHref(): string {
  return GMAIL_SETTINGS_URL;
}

/** Opens Gmail app at inbox. Web cannot detect install or link to in-app signature editor. */
export function openGmailApp(): void {
  if (typeof window === 'undefined') return;
  window.location.href = GMAIL_APP_URL;
}

/** Opens Gmail web Settings → General in a new tab (best path for rich HTML paste on mobile). */
export function openGmailSettingsInBrowser(): void {
  if (typeof window === 'undefined') return;
  window.open(GMAIL_SETTINGS_URL, '_blank', 'noopener,noreferrer');
}
