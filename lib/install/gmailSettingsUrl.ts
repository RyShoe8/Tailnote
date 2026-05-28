/**
 * Gmail web deep link: Settings → General tab (signature editor is on this tab).
 * There is no public URL fragment to scroll directly to Signature; users scroll within General.
 */
export const GMAIL_SETTINGS_URL = 'https://mail.google.com/mail/u/0/#settings/general';

/** Mobile Gmail web UI — preferred for pasting rich HTML signatures on phone browsers. */
export const GMAIL_MOBILE_WEB_SETTINGS_URL =
  'https://mail.google.com/mail/mu/mp/0/#settings/general';

export function openGmailSettings(): void {
  if (typeof window === 'undefined') return;
  window.open(GMAIL_SETTINGS_URL, '_blank', 'noopener,noreferrer');
}
