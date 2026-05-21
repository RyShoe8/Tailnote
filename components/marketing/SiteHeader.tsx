import Link from 'next/link';
import { TailnoteLogo } from '@/components/brand/TailnoteLogo';
import { SiteHeaderNav } from '@/components/marketing/SiteHeaderNav';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-background/85 backdrop-blur-md">
      <div className="container flex min-h-14 min-w-0 items-center justify-between gap-4 py-0">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center leading-none rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <TailnoteLogo
            heightClass="block h-14 sm:h-16 md:h-20 lg:h-24"
            className="-my-2 sm:-my-1"
            priority
          />
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <SiteHeaderNav />
        </div>
      </div>
    </header>
  );
}
