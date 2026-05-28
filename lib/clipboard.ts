import { isMobileDevice } from '@/lib/install/resolveGmailSettingsHref';

export type CopyHtmlMethod = 'html' | 'text' | 'failed';

export type CopyHtmlResult = {
  ok: boolean;
  method: CopyHtmlMethod;
};

/** Removes embedded stylesheet blocks that paste as visible "code" in Gmail mobile. */
export function prepareSignatureHtmlForClipboard(html: string): string {
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').trim();
}

export function stripHtmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function padCfOffset(n: number): string {
  return String(n).padStart(10, '0');
}

/** Windows/Outlook-style HTML clipboard format; improves Gmail and mobile WebKit paste. */
export function wrapClipboardHtml(fragment: string): string {
  const body = `<html><body><!--StartFragment-->${fragment}<!--EndFragment--></body></html>`;
  const versionLine = 'Version:0.9\r\n';
  const placeholder =
    'StartHTML:0000000000\r\nEndHTML:0000000000\r\nStartFragment:0000000000\r\nEndFragment:0000000000\r\n';
  const headerLen = versionLine.length + placeholder.length;
  const startHtml = headerLen;
  const endHtml = headerLen + body.length;
  const startFragment =
    headerLen + body.indexOf('<!--StartFragment-->') + '<!--StartFragment-->'.length;
  const endFragment = headerLen + body.indexOf('<!--EndFragment-->');

  const header =
    versionLine +
    `StartHTML:${padCfOffset(startHtml)}\r\n` +
    `EndHTML:${padCfOffset(endHtml)}\r\n` +
    `StartFragment:${padCfOffset(startFragment)}\r\n` +
    `EndFragment:${padCfOffset(endFragment)}\r\n`;
  return header + body;
}

function copyHtmlUsingSelection(cfHtml: string, displayHtml: string, plain: string): boolean {
  if (typeof document === 'undefined') return false;

  const container = document.createElement('div');
  container.innerHTML = displayHtml;
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
    event.clipboardData?.setData('text/html', cfHtml);
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

async function writeClipboardHtml(cfHtml: string, plain: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard || typeof ClipboardItem === 'undefined') {
    return false;
  }
  try {
    const item = new ClipboardItem({
      'text/html': new Blob([cfHtml], { type: 'text/html' }),
      'text/plain': new Blob([plain], { type: 'text/plain' }),
    });
    await navigator.clipboard.write([item]);
    return true;
  } catch {
    return false;
  }
}

/** Copies rich HTML to the clipboard (Gmail / Outlook paste). */
export async function copyHtmlToClipboard(html: string): Promise<CopyHtmlResult> {
  const trimmed = html.trim();
  if (!trimmed) return { ok: false, method: 'failed' };

  const fragment = prepareSignatureHtmlForClipboard(trimmed);
  if (!fragment) return { ok: false, method: 'failed' };

  const plain = stripHtmlToPlainText(fragment);
  const cfHtml = wrapClipboardHtml(fragment);
  const mobile = typeof window !== 'undefined' && isMobileDevice();

  const trySelection = () => copyHtmlUsingSelection(cfHtml, fragment, plain);
  const tryClipboardItem = () => writeClipboardHtml(cfHtml, plain);

  if (mobile) {
    if (trySelection()) return { ok: true, method: 'html' };
    if (await tryClipboardItem()) return { ok: true, method: 'html' };
  } else {
    if (await tryClipboardItem()) return { ok: true, method: 'html' };
    if (trySelection()) return { ok: true, method: 'html' };
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(plain);
      return { ok: true, method: 'text' };
    } catch {
      // fall through
    }
  } else if (trySelection()) {
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
