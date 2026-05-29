'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { TocHeading } from '@/lib/blog/types';
import { cn } from '@/lib/utils';

type TableOfContentsProps = {
  headings: TocHeading[];
};

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = headings.filter((h) => h.level === 2 || h.level === 3);

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  const nav = (
    <nav aria-label="Table of contents">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        On this page
      </p>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? 'pl-3' : undefined}>
            <a
              href={`#${item.id}`}
              className={cn(
                'block text-muted-foreground transition-colors hover:text-primary',
                activeId === item.id && 'font-medium text-primary'
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <>
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium"
        >
          Table of contents
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', mobileOpen && 'rotate-180')}
            aria-hidden
          />
        </button>
        {mobileOpen ? <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">{nav}</div> : null}
      </div>
      <div className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
          {nav}
        </div>
      </div>
    </>
  );
}
