'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const NAV_ITEMS = [
  { href: '/admin', label: 'Organizations' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/feedback', label: 'Feedback' },
  { href: '/admin/email-health', label: 'Email health' },
  { href: '/admin/content', label: 'Content' },
  { href: '/admin/blog', label: 'Blog' },
  { href: '/admin/quote-categories', label: 'Quote categories' },
  { href: '/admin/quotes', label: 'Quotes' },
  { href: '/admin/plans', label: 'Plans' },
  { href: '/admin/plans/archived', label: 'Archived plans' },
  { href: '/admin/addons', label: 'Add-ons' },
  { href: '/admin/signatures', label: 'Signatures' },
] as const;

const linkClass =
  'text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors';

const sheetLinkClass =
  'rounded-md px-2 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground';

export function AdminHeaderNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const close = () => setOpen(false);

  return (
    <>
      <div className="hidden min-w-0 flex-1 flex-wrap items-center justify-end gap-4 text-sm md:flex">
        <nav className="flex flex-wrap items-center gap-4">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/dashboard" className={`shrink-0 text-sm ${linkClass}`}>
          Back to dashboard
        </Link>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button type="button" variant="outline" size="icon" className="md:hidden" aria-label="Open admin menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="flex w-[min(100%,20rem)] flex-col gap-6 p-4 pt-10">
          <p className="text-sm font-medium text-foreground">Platform admin</p>
          <nav className="flex flex-col gap-1 text-sm">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} onClick={close} className={sheetLinkClass}>
                {item.label}
              </Link>
            ))}
          </nav>
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard" onClick={close}>
              Back to dashboard
            </Link>
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
