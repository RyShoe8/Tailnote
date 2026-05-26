export type CopyHtmlResult = {
  ok: boolean;
  method: 'html' | 'text' | 'failed';
};

export function stripHtmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Copies rich HTML to the clipboard (Gmail / Outlook paste). */
export async function copyHtmlToClipboard(html: string): Promise<CopyHtmlResult> {
  const trimmed = html.trim();
  if (!trimmed) return { ok: false, method: 'failed' };

  const plain = stripHtmlToPlainText(trimmed);

  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return { ok: false, method: 'failed' };
  }

  try {
    if (typeof ClipboardItem !== 'undefined') {
      const item = new ClipboardItem({
        'text/html': new Blob([trimmed], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([item]);
      return { ok: true, method: 'html' };
    }
  } catch {
    // fall through
  }

  try {
    await navigator.clipboard.writeText(trimmed);
    return { ok: true, method: 'text' };
  } catch {
    try {
      await navigator.clipboard.writeText(plain);
      return { ok: true, method: 'text' };
    } catch {
      return { ok: false, method: 'failed' };
    }
  }
}

export function downloadHtml(filename: string, html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
