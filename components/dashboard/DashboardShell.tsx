'use client';

import Link, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { TailnoteLogo } from '@/components/brand/TailnoteLogo';
import { SignOutButton } from '@/components/dashboard/SignOutButton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { FeedbackFab } from '@/components/feedback/FeedbackFab';

export type DashboardNavLink = { href: string; label: string };

const navLinkClass =
  'rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors';

function DashboardNavLabel({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  return (
    <span className={cn(pending && 'opacity-70')}>{label}</span>
  );
}

function DashboardNavItem({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={navLinkClass}
    >
      <DashboardNavLabel label={label} />
    </Link>
  );
}

function DashboardNavLinks({
  navLinks,
  onNavigate,
}: {
  navLinks: DashboardNavLink[];
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1 text-sm">
      {navLinks.map((l) => (
        <DashboardNavItem key={l.href} href={l.href} label={l.label} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

function DashboardSidebarFooter({
  showPlatformAdmin,
  onNavigate,
  className,
}: {
  showPlatformAdmin: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('shrink-0 flex flex-col gap-2 border-t border-border/60 pt-4', className)}>
      {showPlatformAdmin ? (
        <Button variant="outline" className="w-full justify-start px-2" asChild>
          <Link href="/admin" onClick={onNavigate}>
            Platform admin
          </Link>
        </Button>
      ) : null}
      <SignOutButton onSignedOut={onNavigate} />
    </div>
  );
}

type Props = {
  email?: string;
  navLinks: DashboardNavLink[];
  showPlatformAdmin: boolean;
  children: React.ReactNode;
};

export function DashboardShell({ email, navLinks, showPlatformAdmin, children }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="flex min-h-screen flex-col md:h-dvh md:max-h-dvh md:flex-row md:overflow-hidden">
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur md:hidden">
        <Link
          href="/dashboard"
          className="flex min-w-0 shrink-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          <TailnoteLogo heightClass="h-9" />
        </Link>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="flex h-full max-h-[100dvh] w-[min(100%,20rem)] flex-col gap-4 p-4 pt-10"
          >
            <div className="min-w-0 shrink-0">
              <Link
                href="/dashboard"
                onClick={closeMobile}
                className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <TailnoteLogo heightClass="h-10" />
              </Link>
              {email ? <p className="mt-2 truncate text-xs text-muted-foreground">{email}</p> : null}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <DashboardNavLinks navLinks={navLinks} onNavigate={closeMobile} />
            </div>
            <DashboardSidebarFooter showPlatformAdmin={showPlatformAdmin} onNavigate={closeMobile} />
          </SheetContent>
        </Sheet>
      </header>

      <aside className="hidden h-full min-h-0 w-56 shrink-0 flex-col gap-4 overflow-hidden border-r bg-muted/20 p-4 md:flex">
        <div className="min-w-0 shrink-0">
          <Link
            href="/dashboard"
            className="block shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <TailnoteLogo heightClass="h-12 md:h-14" />
          </Link>
          {email ? <p className="mt-1 truncate text-xs text-muted-foreground">{email}</p> : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <DashboardNavLinks navLinks={navLinks} />
        </div>
        <DashboardSidebarFooter showPlatformAdmin={showPlatformAdmin} />
      </aside>

      <main className="min-h-0 min-w-0 flex-1 overflow-auto p-4 pb-24 md:p-6 md:pb-10 lg:p-10 lg:pb-12">
        {children}
      </main>
      <FeedbackFab />
    </div>
  );
}
