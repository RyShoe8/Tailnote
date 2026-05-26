/** Gmail web: Settings → General (signature editor). */
export const GMAIL_SETTINGS_URL = 'https://mail.google.com/mail/u/0/#settings/general';

export function openGmailSettings(): void {
  if (typeof window === 'undefined') return;
  window.open(GMAIL_SETTINGS_URL, '_blank', 'noopener,noreferrer');
}
