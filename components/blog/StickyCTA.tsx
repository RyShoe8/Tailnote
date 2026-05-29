'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';
import { capturePostHogEvent } from '@/components/analytics/PostHogProvider';
import { Button } from '@/components/ui/button';

export function StickyCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const onScroll = () => {
      setVisible(window.scrollY > 600);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [dismissed]);

  if (!visible || dismissed) return null;

  return (
    <>
      <aside className="fixed bottom-4 left-4 right-4 z-40 lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-ring">
          <p className="text-sm font-medium text-foreground">Try Tailnote for your team</p>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild size="sm" className="gap-1">
              <Link
                href="/signup"
                onClick={() => capturePostHogEvent('blog_sticky_cta_click', { target: 'signup' })}
              >
                Start free
                <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </Button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <aside className="fixed bottom-8 right-8 z-40 hidden max-w-xs lg:block">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-ring">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold text-primary">Tailnote</p>
          <p className="mt-1 pr-6 text-sm font-medium text-foreground">
            Branded signatures for every employee email
          </p>
          <Button asChild size="sm" className="mt-4 w-full gap-1">
            <Link
              href="/signup"
              onClick={() => capturePostHogEvent('blog_sticky_cta_click', { target: 'signup' })}
            >
              Get started free
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </Button>
        </div>
      </aside>
    </>
  );
}
