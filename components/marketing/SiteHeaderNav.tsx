'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export const PRODUCT_NAV = [
  { href: '/templates', label: 'Templates' },
  { href: '/promotional-blocks', label: 'Promotional Blocks' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/email-health', label: 'Email Health' },
] as const;

const AUTH_NAV = [{ href: '/login', label: 'Log in' }] as const;

export function SiteHeaderProductNav() {
  return (
    <nav className="hidden min-w-0 items-center gap-x-4 text-sm text-muted-foreground lg:flex lg:gap-x-5">
      {PRODUCT_NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="whitespace-nowrap transition-colors hover:text-foreground"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function SiteHeaderAuth() {
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
        <Link href="/signup">Sign up</Link>
      </Button>
    </div>
  );
}

export function SiteHeaderMobileMenu() {
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
              onClick={close}
              className="rounded-md px-2 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          {AUTH_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="rounded-md px-2 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Button asChild className="w-full">
          <Link href="/signup" onClick={close}>
            Sign up
          </Link>
        </Button>
      </SheetContent>
    </Sheet>
  );
}
