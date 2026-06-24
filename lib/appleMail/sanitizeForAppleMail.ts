/** Post-process rendered signature HTML for Apple Mail `.mailsignature` embedding. */
export function sanitizeForAppleMail(html: string): string {
  let out = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Open-tracking pixels must not live in a static Mail signature (fires on every compose).
  out = out.replace(
    /<img[^>]*src=["'][^"']*\/api\/track\/signature\/open[^"']*["'][^>]*>/gi,
    ''
  );

  out = ensureHttpsImages(out);
  out = ensureImageDimensions(out);

  return out.trim();
}

function ensureHttpsImages(html: string): string {
  return html.replace(/<img([^>]*)\ssrc=["']([^"']+)["']([^>]*)>/gi, (match, before, src, after) => {
    const trimmed = src.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('data:')) return match;
    if (trimmed.startsWith('//')) {
      return `<img${before} src="https:${trimmed}"${after}>`;
    }
    if (trimmed.startsWith('http://')) return '';
    if (trimmed.startsWith('https://')) return match;
    return '';
  });
}

function ensureImageDimensions(html: string): string {
  return html.replace(/<img([^>]*)>/gi, (match, attrs: string) => {
    const hasWidth = /\bwidth\s*=/.test(attrs);
    const hasHeight = /\bheight\s*=/.test(attrs);
    if (hasWidth && hasHeight) return match;
    let next = attrs;
    if (!hasWidth) next += ' width="110"';
    if (!hasHeight) next += ' height="44"';
    return `<img${next}>`;
  });
}
