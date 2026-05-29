'use client';

import { useMemo, useState } from 'react';
import { BlogCard } from '@/components/blog/BlogCard';
import { CategoryPill } from '@/components/blog/CategoryPill';
import type { BlogPostListItem } from '@/lib/blog/types';

type BlogIndexClientProps = {
  posts: BlogPostListItem[];
  categories: string[];
  featuredSlug?: string;
  initialCategory?: string;
};

export function BlogIndexClient({
  posts,
  categories,
  featuredSlug,
  initialCategory,
}: BlogIndexClientProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory ?? '');

  const filtered = useMemo(() => {
    return posts.filter((post) => {
      if (featuredSlug && post.slug === featuredSlug) return false;
      if (activeCategory && post.category !== activeCategory) return false;
      return true;
    });
  }, [posts, activeCategory, featuredSlug]);

  return (
    <section className="container pb-16 sm:pb-20">
      {categories.length > 0 ? (
        <div className="mb-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Categories
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory('')}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                !activeCategory
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-slate-200 bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <CategoryPill
                key={cat}
                category={cat}
                active={activeCategory === cat}
                onClick={() => setActiveCategory(activeCategory === cat ? '' : cat)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <h2 className="mb-6 text-xl font-semibold tracking-tight text-foreground">
        {activeCategory ? 'Filtered articles' : 'Latest articles'}
      </h2>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-muted-foreground">
          No articles match your filters.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}
