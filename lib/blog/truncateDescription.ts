const LIST_DESCRIPTION_MAX = 200;
const ELLIPSIS = '...';

export function truncateBlogDescription(text: string, maxLength = LIST_DESCRIPTION_MAX): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;

  const cutAt = maxLength - ELLIPSIS.length;
  let truncated = normalized.slice(0, cutAt);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > cutAt - 40) {
    truncated = truncated.slice(0, lastSpace);
  }
  return truncated.trimEnd() + ELLIPSIS;
}
