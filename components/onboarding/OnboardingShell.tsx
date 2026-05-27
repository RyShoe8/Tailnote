'use client';

import Link from 'next/link';
import { TailnoteLogo } from '@/components/brand/TailnoteLogo';
import { SignOutButton } from '@/components/dashboard/SignOutButton';

type OnboardingShellProps = {
  children: React.ReactNode;
};

export function OnboardingShell({ children }: OnboardingShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="border-b border-slate-200/70 bg-background/85 backdrop-blur-md">
        <div className="container flex min-h-14 items-center justify-between gap-4 py-2">
          <Link
            href="/"
            className="flex shrink-0 items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <TailnoteLogo heightClass="h-10 sm:h-12" priority />
          </Link>
          <SignOutButton variant="outline" size="sm" className="shrink-0" />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-12">{children}</main>
    </div>
  );
}
