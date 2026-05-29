import Link from 'next/link';
import { RecaptchaNotice } from '@/components/recaptcha/RecaptchaNotice';
import { EMAIL_HEALTH_NAV_TITLE } from '@/lib/email-health/seoCopy';

const MEDIA_SHOP_URL = 'https://themediashop.co';

const FOOTER_LINKS = {
  product: [
    { href: '/templates', label: 'Templates' },
    { href: '/promotional-blocks', label: 'Promotional Blocks' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/blog', label: 'Blog' },
    { href: '/pricing', label: 'Pricing' },
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
        <div className="grid gap-8 sm:grid-cols-3 sm:gap-10">
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
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200/70 pt-8 sm:flex-row sm:items-center sm:justify-between">
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
