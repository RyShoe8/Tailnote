import { GMAIL_SETTINGS_URL, GMAIL_MOBILE_WEB_SETTINGS_URL } from '@/lib/install/gmailSettingsUrl';

export const GMAIL_APP_URL = 'googlegmail://';

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const coarse =
    typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 1023px)').matches;
  const ua = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return coarse || ua;
}

/** Best-effort Gmail settings URL for the current device (rich HTML via web settings). */
export function resolveGmailSettingsHref(): string {
  return isMobileDevice() ? GMAIL_MOBILE_WEB_SETTINGS_URL : GMAIL_SETTINGS_URL;
}

/**
 * Opens Gmail on mobile: try native app, then fall back to mobile web settings.
 * There is no public deep link to the in-app signature editor.
 */
export function openGmailSettingsMobileAware(): void {
  if (typeof window === 'undefined') return;

  const mobileWeb = GMAIL_MOBILE_WEB_SETTINGS_URL;
  if (!isMobileDevice()) {
    window.open(GMAIL_SETTINGS_URL, '_blank', 'noopener,noreferrer');
    return;
  }

  const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  if (isIos || isAndroid) {
    const fallbackTimer = window.setTimeout(() => {
      window.location.href = mobileWeb;
    }, 600);
    const clearFallback = () => window.clearTimeout(fallbackTimer);
    window.addEventListener('pagehide', clearFallback, { once: true });
    window.location.href = GMAIL_APP_URL;
    return;
  }

  window.open(mobileWeb, '_blank', 'noopener,noreferrer');
}
