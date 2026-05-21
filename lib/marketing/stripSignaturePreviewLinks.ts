/**
 * Marketing previews are layout demos — strip navigation from anchor tags
 * while preserving inline styles on the former link elements.
 */
export function stripSignaturePreviewLinks(html: string): string {
  return html
    .replace(/<a\b([^>]*)>/gi, (_, attrs: string) => {
      const cleaned = attrs
        .replace(/\s+href\s*=\s*(?:"[^"]*"|'[^']*')/gi, '')
        .replace(/\s+target\s*=\s*(?:"[^"]*"|'[^']*')/gi, '')
        .replace(/\s+rel\s*=\s*(?:"[^"]*"|'[^']*')/gi, '');
      return `<span${cleaned}>`;
    })
    .replace(/<\/a>/gi, '</span>');
}
