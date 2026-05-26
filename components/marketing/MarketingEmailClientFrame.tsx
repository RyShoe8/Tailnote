'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  children: ReactNode;
  className?: string;
  /** Blur gradients + floating orbs behind the window (carousel: active slide only). */
  showAmbience?: boolean;
  /** hero: narrow column; carousel: wider showcase column */
  layout?: 'hero' | 'carousel';
  /** Carousel: active slide gets lift + perspective tilt */
  active?: boolean;
};

function EmailClientAmbience() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-[#0065c9]/10 via-[#0c8fa3]/8 to-[#4fd6b2]/15 blur-2xl sm:-inset-8 sm:rounded-[2.5rem] sm:from-[#0065c9]/15 sm:via-[#0c8fa3]/10 sm:to-[#4fd6b2]/20 sm:blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 -z-10 hidden h-40 w-40 rounded-full bg-[#4fd6b2]/30 blur-2xl md:block tn-float"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-8 bottom-10 -z-10 hidden h-32 w-32 rounded-full bg-[#0065c9]/30 blur-2xl md:block tn-float"
        style={{ animationDelay: '2s' }}
      />
    </>
  );
}

function EmailComposerChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-3 py-2.5 sm:px-5 sm:py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden />
        </div>
        <p className="truncate text-xs font-medium text-slate-500">New message</p>
        <span className="w-12" aria-hidden />
      </div>

      <div className="space-y-2 border-b border-slate-100 px-3 py-2.5 text-xs text-slate-500 sm:space-y-3 sm:px-5 sm:py-3">
        <div className="flex items-center gap-3">
          <span className="w-12 shrink-0 font-medium text-slate-400">To</span>
          <span className="truncate text-slate-700">jordan@northwind.co</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-12 shrink-0 font-medium text-slate-400">Subject</span>
          <span className="truncate text-slate-700">Quick intro from Acme</span>
        </div>
      </div>

      <div className="space-y-3 px-3 py-4 text-xs text-slate-700 sm:space-y-4 sm:px-6 sm:py-6 sm:text-sm">
        <p>Hi Jordan,</p>
        <p>
          Great chatting earlier, sharing a couple of useful links below. Happy to set up a quick
          call this week if you&apos;d like to dig into the numbers.
        </p>
        <p>Cheers,</p>
        {children}
      </div>
    </>
  );
}

/**
 * Shared marketing email composer chrome (traffic lights, To/Subject, body stub).
 * Signature content is passed as `children` — no extra inner card border.
 */
export function MarketingEmailClientFrame({
  children,
  className,
  showAmbience = false,
  layout = 'hero',
  active,
}: Props) {
  const isCarousel = layout === 'carousel';

  return (
    <div
      className={cn(
        'relative mx-auto w-full min-w-0',
        layout === 'hero' && 'max-w-[22rem] sm:mx-0 sm:max-w-none',
        layout === 'carousel' && 'max-w-3xl px-1 sm:px-0',
        className
      )}
    >
      {showAmbience ? <EmailClientAmbience /> : null}

      {isCarousel ? (
        <div
          className={cn(
            'home-carousel-email-stage-outer overflow-visible transition-all duration-500 motion-reduce:transition-none',
            active && 'home-carousel-email-stage-outer--active shadow-ring',
            !active && 'shadow-card'
          )}
          data-active={active ? 'true' : 'false'}
        >
          <div className="home-carousel-email-stage-inner relative overflow-visible rounded-2xl border border-slate-200/80 bg-white ring-1 ring-slate-900/5">
            <EmailComposerChrome>{children}</EmailComposerChrome>
          </div>
        </div>
      ) : (
        <div className="home-carousel-email-stage relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-ring ring-1 ring-slate-900/5 sm:rounded-3xl">
          <EmailComposerChrome>{children}</EmailComposerChrome>
        </div>
      )}
    </div>
  );
}
