import Link from 'next/link';
import { TailnoteLogo } from '@/components/brand/TailnoteLogo';
import {
  SiteHeaderAuth,
  SiteHeaderMobileMenu,
  SiteHeaderProductNav,
} from '@/components/marketing/SiteHeaderNav';

type SiteHeaderProps = {
  isLoggedIn?: boolean;
};

export function SiteHeader({ isLoggedIn = false }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-background/85 backdrop-blur-md">
      <div className="container flex min-h-14 min-w-0 items-center justify-between gap-3 py-0 sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-4 lg:gap-6 xl:gap-8">
          <Link
            href="/"
            className="flex shrink-0 items-center overflow-visible leading-none rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <TailnoteLogo
              heightClass="block h-14 sm:h-16 md:h-20 lg:h-24"
              className="max-sm:origin-left max-sm:scale-[1.2] sm:scale-100"
              priority
            />
          </Link>
          <SiteHeaderProductNav />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <SiteHeaderAuth isLoggedIn={isLoggedIn} />
          <SiteHeaderMobileMenu isLoggedIn={isLoggedIn} />
        </div>
      </div>
    </header>
  );
}
