import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/mongoose';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { CheckoutSuccessBanner } from '@/components/dashboard/CheckoutSuccessBanner';
import { isOrganizationPaid } from '@/lib/billing/subscriptionAccess';
import { OrganizationModel } from '@/models/Organization';
import { NOINDEX_METADATA } from '@/lib/seo/metadata';

export const metadata = NOINDEX_METADATA;

export const dynamic = 'force-dynamic';

const links = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/analytics', label: 'Analytics' },
  { href: '/dashboard/employees', label: 'Employees' },
  { href: '/dashboard/signature', label: 'Signature' },
  { href: '/dashboard/billing', label: 'Billing' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session?.user) {
    redirect('/login');
  }
  const user = session.user as {
    email?: string;
    organizationId?: string;
    id?: string;
    role?: string;
  };

  if (!user.organizationId) {
    redirect('/onboarding');
  }

  await connectMongoose();
  const org = await OrganizationModel.findById(user.organizationId);
  if (!org) {
    redirect('/onboarding');
  }

  if (!isOrganizationPaid(org)) {
    if (user.role === 'owner') {
      redirect('/onboarding');
    }
    const { isPlatformAdmin } = await import('@/lib/auth/platformAdmin');
    const showPlatformAdmin = user.id ? await isPlatformAdmin(user.id) : false;
    return (
      <DashboardShell email={user.email} navLinks={links} showPlatformAdmin={showPlatformAdmin}>
        <div className="mx-auto max-w-lg rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Subscription not active</p>
          <p className="mt-2">
            Your organization owner has not completed checkout yet. Ask them to finish subscribing
            before you can use Tailnote.
          </p>
        </div>
      </DashboardShell>
    );
  }

  const { isPlatformAdmin } = await import('@/lib/auth/platformAdmin');
  const showPlatformAdmin = user.id ? await isPlatformAdmin(user.id) : false;

  return (
    <DashboardShell email={user.email} navLinks={links} showPlatformAdmin={showPlatformAdmin}>
      <CheckoutSuccessBanner />
      {children}
    </DashboardShell>
  );
}
