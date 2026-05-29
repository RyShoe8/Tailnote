const EMAIL_ASSET_ICON_SRC = /(\ssrc=)(["'])([^"']*email-assets\/icon-[^"']+\.(?:png|gif|jpe?g))\2/gi;

export function resolveEmailAssetIconUrl(raw: string, origin: string): string {
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith('//')) return `https:${t}`;
  const base = origin.replace(/\/+$/, '');
  return t.startsWith('/') ? `${base}${t}` : `${base}/${t}`;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Replace hosted /email-assets/icon-* img src with data URLs for Gmail paste.
 * No-op on server; leaves original URLs when fetch fails.
 */
export async function inlineEmailAssetIcons(html: string, origin?: string): Promise<string> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') {
    return html;
  }

  const baseOrigin = (origin ?? window.location.origin).replace(/\/+$/, '');
  const urls = new Map<string, string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(EMAIL_ASSET_ICON_SRC.source, 'gi');
  while ((m = re.exec(html)) !== null) {
    const src = m[3];
    if (!src || src.startsWith('data:')) continue;
    urls.set(src, resolveEmailAssetIconUrl(src, baseOrigin));
  }

  if (urls.size === 0) return html;

  const dataBySrc = new Map<string, string>();
  await Promise.all(
    [...urls.entries()].map(async ([src, absolute]) => {
      try {
        const res = await fetch(absolute, { credentials: 'omit', cache: 'force-cache' });
        if (!res.ok) return;
        const blob = await res.blob();
        const dataUrl = await blobToDataUrl(blob);
        if (dataUrl.startsWith('data:')) {
          dataBySrc.set(src, dataUrl);
        }
      } catch {
        /* keep hosted URL */
      }
    })
  );

  if (dataBySrc.size === 0) return html;

  return html.replace(EMAIL_ASSET_ICON_SRC, (match, prefix, quote, src) => {
    const dataUrl = dataBySrc.get(src);
    return dataUrl ? `${prefix}${quote}${dataUrl}${quote}` : match;
  });
}
