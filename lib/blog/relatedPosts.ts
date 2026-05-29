import type { BlogPostMeta } from '@/lib/blog/types';
import { getPublishedPosts, toListItem } from '@/lib/blog/loadPosts';
import type { BlogPostListItem } from '@/lib/blog/types';

function scoreRelated(current: BlogPostMeta, candidate: BlogPostMeta): number {
  if (current.slug === candidate.slug) return -1;

  let score = 0;
  if (current.category === candidate.category) score += 2;
  for (const tag of current.tags ?? []) {
    if (candidate.tags?.includes(tag)) score += 1;
  }
  return score;
}

export async function getRelatedPosts(
  post: BlogPostMeta,
  limit = 3
): Promise<BlogPostListItem[]> {
  const published = await getPublishedPosts();

  const scored = published
    .map((candidate) => ({ candidate, score: scoreRelated(post, candidate) }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || b.candidate.publishedAt.localeCompare(a.candidate.publishedAt)
    );

  if (scored.length >= limit) {
    return scored.slice(0, limit).map(({ candidate }) => toListItem(candidate));
  }

  const fallback = published.filter((p) => p.slug !== post.slug).slice(0, limit).map(toListItem);

  const seen = new Set(scored.map(({ candidate }) => candidate.slug));
  const related = scored.map(({ candidate }) => toListItem(candidate));
  for (const item of fallback) {
    if (related.length >= limit) break;
    if (!seen.has(item.slug)) {
      related.push(item);
      seen.add(item.slug);
    }
  }

  return related.slice(0, limit);
}
