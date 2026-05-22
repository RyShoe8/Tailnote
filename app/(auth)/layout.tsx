import { ReactNode } from 'react';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { NOINDEX_METADATA } from '@/lib/seo/metadata';

export const metadata = NOINDEX_METADATA;

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-background">
      <div
        aria-hidden
        className="tn-grad-bg-soft pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]"
      />
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full min-w-0 max-w-sm">
          <div className="tn-rise">{children}</div>
        </div>
      </div>
      <SiteFooter variant="compact" />
    </div>
  );
}
