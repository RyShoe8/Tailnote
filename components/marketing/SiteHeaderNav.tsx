'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { SignOutButton } from '@/components/dashboard/SignOutButton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { EMAIL_HEALTH_NAV_TITLE } from '@/lib/email-health/seoCopy';

export const PRODUCT_NAV = [
  { href: '/signatures', label: 'Signatures' },
  { href: '/promotional-blocks', label: 'Promotional Blocks' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Blog' },
  { href: '/spotlight', label: 'Spotlight' },
  { href: '/spotlight/vote', label: 'Vote' },
  { href: '/email-health', label: 'Email Health', title: EMAIL_HEALTH_NAV_TITLE },
] as const;

const AUTH_NAV = [{ href: '/login', label: 'Log In' }] as const;

type AuthNavProps = {
  isLoggedIn?: boolean;
};

export function SiteHeaderProductNav() {
  return (
    <nav className="hidden min-w-0 items-center gap-x-4 text-sm text-muted-foreground lg:flex lg:gap-x-5">
      {PRODUCT_NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          title={'title' in item ? item.title : undefined}
          className="whitespace-nowrap transition-colors hover:text-foreground"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function SiteHeaderAuth({ isLoggedIn = false }: AuthNavProps) {
  if (isLoggedIn) {
    return (
      <div className="hidden shrink-0 items-center gap-2 md:flex">
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <SignOutButton variant="outline" size="sm" className="shrink-0" />
      </div>
    );
  }

  return (
    <div className="hidden shrink-0 items-center gap-2 md:flex">
      {AUTH_NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {item.label}
        </Link>
      ))}
      <Button asChild size="sm">
        <Link href="/signup">Sign Up</Link>
      </Button>
    </div>
  );
}

export function SiteHeaderMobileMenu({ isLoggedIn = false }: AuthNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-[min(100%,20rem)] flex-col gap-6 p-4 pt-10">
        <p className="text-sm font-medium text-foreground">Menu</p>
        <nav className="flex flex-col gap-1 text-sm">
          {PRODUCT_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={'title' in item ? item.title : undefined}
              onClick={close}
              className="rounded-md px-2 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          {!isLoggedIn
            ? AUTH_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="rounded-md px-2 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))
            : null}
        </nav>
        {isLoggedIn ? (
          <div className="mt-auto flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/dashboard" onClick={close}>
                Dashboard
              </Link>
            </Button>
            <SignOutButton
              variant="outline"
              className="w-full"
              onSignedOut={close}
            />
          </div>
        ) : (
          <Button asChild className="w-full">
            <Link href="/signup" onClick={close}>
              Sign Up
            </Link>
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
}
