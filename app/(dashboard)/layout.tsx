import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { CheckoutSuccessBanner } from '@/components/dashboard/CheckoutSuccessBanner';
import { getDashboardLayoutContext } from '@/lib/dashboard/getDashboardContext';
import { NOINDEX_METADATA } from '@/lib/seo/metadata';

export const metadata = NOINDEX_METADATA;

export const dynamic = 'force-dynamic';

const links = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/brand-trust', label: 'Brand Trust Center' },
  { href: '/dashboard/signature', label: 'Signature' },
  { href: '/dashboard/analytics', label: 'Analytics' },
  { href: '/dashboard/spotlight', label: 'Spotlight' },
  { href: '/dashboard/employees', label: 'Employees' },
  { href: '/dashboard/billing', label: 'Billing' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, showPlatformAdmin } = await getDashboardLayoutContext();

  return (
    <DashboardShell email={user.email} navLinks={links} showPlatformAdmin={showPlatformAdmin}>
      <CheckoutSuccessBanner />
      {children}
    </DashboardShell>
  );
}
