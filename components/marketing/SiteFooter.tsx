import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RecaptchaNotice } from '@/components/recaptcha/RecaptchaNotice';
import { EMAIL_HEALTH_NAV_TITLE } from '@/lib/email-health/seoCopy';

const MEDIA_SHOP_URL = 'https://themediashop.co';

const SOCIAL_LINKS = [
  { href: 'https://bsky.app/profile/themediashop.bsky.social', label: 'Bluesky' },
  { href: 'https://www.reddit.com/r/TheMediaShop/', label: 'Reddit' },
  { href: 'https://www.linkedin.com/in/ryanschumacher/', label: 'LinkedIn' },
] as const;

const FOOTER_LINKS = {
  product: [
    { href: '/signatures', label: 'Signatures' },
    { href: '/promotional-blocks', label: 'Promotional Blocks' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/blog', label: 'Blog' },
    { href: '/spotlight', label: 'Spotlight' },
    { href: '/email-health', label: 'Email Health', title: EMAIL_HEALTH_NAV_TITLE },
  ],
  company: [
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
  ],
  legal: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms and Conditions' },
  ],
} as const;

const COMPACT_LINKS = [
  ...FOOTER_LINKS.company,
  ...FOOTER_LINKS.legal,
] as const;

type SiteFooterProps = {
  variant?: 'full' | 'compact';
};

function FooterLink({ href, label, title }: { href: string; label: string; title?: string }) {
  return (
    <Link
      href={href}
      title={title}
      className="transition-colors hover:text-foreground hover:underline underline-offset-4"
    >
      {label}
    </Link>
  );
}

function MediaShopCopyright() {
  const year = new Date().getFullYear();
  return (
    <p className="text-sm text-muted-foreground">
      © {year}{' '}
      <a
        href={MEDIA_SHOP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4 transition-colors hover:text-foreground"
      >
        The Media Shop
      </a>
    </p>
  );
}

function FeaturedOnSection({ centered = false }: { centered?: boolean }) {
  return (
    <div className={centered ? 'text-center' : ''}>
      <p className="mb-3 text-sm font-medium text-foreground">Featured On</p>
      <a
        href="https://marketingdb.live"
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        className="inline-block opacity-90 transition-opacity hover:opacity-100"
      >
        <img
          src="https://marketingdb.live/badge.svg"
          alt="Listed on MarketingDB"
          width={190}
          height={44}
          className="h-11 w-auto"
        />
      </a>
    </div>
  );
}

export function SiteFooter({ variant = 'full' }: SiteFooterProps) {
  if (variant === 'compact') {
    return (
      <footer className="relative border-t border-slate-200/70">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
        />
        <div className="container py-6">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center text-sm text-muted-foreground">
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {COMPACT_LINKS.map((item) => (
                <FooterLink key={item.href} href={item.href} label={item.label} />
              ))}
            </nav>
            <FeaturedOnSection centered />
            <MediaShopCopyright />
            <RecaptchaNotice />
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="relative border-t border-slate-200/70 py-10 sm:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
      />
      <div className="container">
        <div className="border-b border-slate-200/70 pb-10 mb-10 text-center">
          <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Turn your email into a marketing channel
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            On-brand signatures, promotional blocks, and click tracking — free to start.
          </p>
          <div className="mt-4">
            <Button asChild size="lg" className="gap-2 shadow-card">
              <Link href="/signup">
                Get started free
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 sm:gap-10">
          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Product</p>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {FOOTER_LINKS.product.map((item) => (
                <li key={item.href}>
                  <FooterLink
                    href={item.href}
                    label={item.label}
                    title={'title' in item ? item.title : undefined}
                  />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Company</p>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {FOOTER_LINKS.company.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href} label={item.label} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Legal</p>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {FOOTER_LINKS.legal.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href} label={item.label} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Follow Us</p>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {SOCIAL_LINKS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-foreground hover:underline underline-offset-4"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-200/70 pt-8">
          <FeaturedOnSection />
        </div>
        <div className="mt-8 flex flex-col gap-3 border-t border-slate-200/70 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <MediaShopCopyright />
          <p className="text-sm text-muted-foreground">
            Tailnote is operated by{' '}
            <a
              href={MEDIA_SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 transition-colors hover:text-foreground"
            >
              The Media Shop
            </a>
          </p>
        </div>
        <div className="mt-4 max-w-2xl">
          <RecaptchaNotice />
        </div>
      </div>
    </footer>
  );
}
