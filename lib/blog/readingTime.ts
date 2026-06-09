const CHARS_PER_MINUTE = 1200;

export function computeReadingTime(text: string): string {
  const charCount = text.replace(/\s+/g, ' ').trim().length;
  const minutes = Math.max(1, Math.ceil(charCount / CHARS_PER_MINUTE));
  return `${minutes} min read`;
}
