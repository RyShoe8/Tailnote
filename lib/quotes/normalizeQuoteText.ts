/** Normalize quote text for duplicate comparison. */
export function normalizeQuoteText(text: string): string {
  return text
    .trim()
    .replace(/[\u201C\u201D"]/g, '"')
    .replace(/[\u2018\u2019']/g, "'")
    .replace(/^["']+|["']+$/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}
