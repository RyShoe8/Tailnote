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

function copyHtmlUsingSelection(html: string, plain: string): boolean {
  if (typeof document === 'undefined') return false;

  const container = document.createElement('div');
  container.innerHTML = html;
  container.setAttribute('contenteditable', 'true');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  document.body.appendChild(container);

  const selection = window.getSelection();
  if (!selection) {
    document.body.removeChild(container);
    return false;
  }

  const range = document.createRange();
  range.selectNodeContents(container);
  selection.removeAllRanges();
  selection.addRange(range);

  let copied = false;
  const onCopy = (event: ClipboardEvent) => {
    event.preventDefault();
    event.clipboardData?.setData('text/html', html);
    event.clipboardData?.setData('text/plain', plain);
    copied = true;
  };
  document.addEventListener('copy', onCopy);

  try {
    copied = document.execCommand('copy') || copied;
  } catch {
    copied = false;
  }

  document.removeEventListener('copy', onCopy);
  selection.removeAllRanges();
  document.body.removeChild(container);
  return copied;
}

/** Copies rich HTML to the clipboard (Gmail / Outlook paste). */
export async function copyHtmlToClipboard(html: string): Promise<CopyHtmlResult> {
  const trimmed = html.trim();
  if (!trimmed) return { ok: false, method: 'failed' };

  const plain = stripHtmlToPlainText(trimmed);

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
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

    if (copyHtmlUsingSelection(trimmed, plain)) {
      return { ok: true, method: 'html' };
    }

    try {
      await navigator.clipboard.writeText(plain);
      return { ok: true, method: 'text' };
    } catch {
      // fall through
    }
  } else if (copyHtmlUsingSelection(trimmed, plain)) {
    return { ok: true, method: 'html' };
  }

  return { ok: false, method: 'failed' };
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
