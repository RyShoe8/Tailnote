'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const NAV_ITEMS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/templates', label: 'Templates' },
  { href: '/email-health', label: 'Email Health' },
  { href: '/login', label: 'Log in' },
] as const;

export function SiteHeaderNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const close = () => setOpen(false);

  return (
    <>
      <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="transition-colors hover:text-foreground">
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="hidden md:block">
        <Button asChild size="sm">
          <Link href="/signup">Sign up</Link>
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button type="button" variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="flex w-[min(100%,20rem)] flex-col gap-6 p-4 pt-10">
          <p className="text-sm font-medium text-foreground">Menu</p>
          <nav className="flex flex-col gap-1 text-sm">
            {NAV_ITEMS.map((item) => (
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
    </>
  );
}
