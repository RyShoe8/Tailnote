import readingTime from 'reading-time';

export function computeReadingTime(text: string): string {
  const stats = readingTime(text);
  return stats.text;
}
