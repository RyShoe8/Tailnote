import { slugify } from '@/lib/blog/categories';
import type { TocHeading } from '@/lib/blog/types';

export function extractHeadings(markdown: string): TocHeading[] {
  const headings: TocHeading[] = [];

  for (const line of markdown.split('\n')) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) continue;

    const level = match[1].length as 2 | 3;
    const text = match[2]
      .replace(/\*\*|__/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();
    if (!text) continue;

    headings.push({ level, text, id: slugify(text) });
  }

  return headings;
}
