'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { BlogCard } from '@/components/blog/BlogCard';
import { CategoryPill } from '@/components/blog/CategoryPill';
import { TagPill } from '@/components/blog/TagPill';
import { Input } from '@/components/ui/input';
import type { BlogPostListItem } from '@/lib/blog/types';

type BlogIndexClientProps = {
  posts: BlogPostListItem[];
  categories: string[];
  tags: string[];
  featuredSlug?: string;
  initialCategory?: string;
  initialTag?: string;
};

export function BlogIndexClient({
  posts,
  categories,
  tags,
  featuredSlug,
  initialCategory,
  initialTag,
}: BlogIndexClientProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(initialCategory ?? '');
  const [activeTag, setActiveTag] = useState(initialTag ?? '');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (featuredSlug && post.slug === featuredSlug) return false;
      if (activeCategory && post.category !== activeCategory) return false;
      if (activeTag && !post.tags?.includes(activeTag)) return false;
      if (q && !post.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [posts, query, activeCategory, activeTag, featuredSlug]);

  return (
    <section className="container pb-16 sm:pb-20">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Search articles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Search blog posts"
          />
        </div>
      </div>

      {categories.length > 0 ? (
        <div className="mb-4">
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
                onClick={() => {
                  setActiveCategory(activeCategory === cat ? '' : cat);
                  setActiveTag('');
                }}
              />
            ))}
          </div>
        </div>
      ) : null}

      {tags.length > 0 ? (
        <div className="mb-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tags
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <TagPill
                key={tag}
                tag={tag}
                active={activeTag === tag}
                onClick={() => {
                  setActiveTag(activeTag === tag ? '' : tag);
                  setActiveCategory('');
                }}
              />
            ))}
          </div>
        </div>
      ) : null}

      <h2 className="mb-6 text-xl font-semibold tracking-tight text-foreground">
        {activeCategory || activeTag || query ? 'Filtered articles' : 'Latest articles'}
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
