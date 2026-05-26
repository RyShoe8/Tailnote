/**
 * Outlook on the web: Mail → Compose and reply (email signature editor).
 * Classic tenants may use OUTLOOK_WORK_LAYOUT_SETTINGS_URL instead (see OutlookInstallHelp).
 */
export const OUTLOOK_WORK_SETTINGS_URL =
  'https://outlook.office.com/mail/options/mail/composeAndReply';

/** Outlook.com / personal Microsoft account. */
export const OUTLOOK_PERSONAL_SETTINGS_URL =
  'https://outlook.live.com/mail/0/options/mail/composeAndReply';

/** Older OWA path: Mail → Layout → Email signature (fallback copy only). */
export const OUTLOOK_WORK_LAYOUT_SETTINGS_URL =
  'https://outlook.office.com/mail/options/mail/layout';

export function openOutlookWorkSettings(): void {
  if (typeof window === 'undefined') return;
  window.open(OUTLOOK_WORK_SETTINGS_URL, '_blank', 'noopener,noreferrer');
}

export function openOutlookPersonalSettings(): void {
  if (typeof window === 'undefined') return;
  window.open(OUTLOOK_PERSONAL_SETTINGS_URL, '_blank', 'noopener,noreferrer');
}
