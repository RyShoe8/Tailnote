import '@/lib/billing-engine';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import { getServerSession } from '@/lib/auth/session';
import { sanitizeInternalRedirect } from '@/lib/auth/sanitizeInternalRedirect';
import { connectMongoose } from '@/lib/mongoose';
import { getPublicPricingPlans } from 'billing-engine';
import { hasDashboardAccess } from '@/lib/billing/subscriptionAccess';
import { OrganizationModel } from '@/models/Organization';
import { findPendingInviteByEmail } from '@/lib/employees/findPendingInviteByEmail';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

async function OnboardingContent({ redirectParam }: { redirectParam?: string }) {
  const session = await getServerSession();
  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user as {
    email?: string;
    organizationId?: string;
    role?: string;
  };

  if (!user.organizationId && user.email) {
    const pending = await findPendingInviteByEmail(user.email);
    if (pending?.inviteToken) {
      redirect(`/invite/${encodeURIComponent(pending.inviteToken)}?accept=1`);
    }
  }

  const plans = await getPublicPricingPlans();
  const afterOnboarding = sanitizeInternalRedirect(redirectParam) ?? '/dashboard';

  if (user.organizationId) {
    await connectMongoose();
    const org = await OrganizationModel.findById(user.organizationId).lean<{
      name?: string;
      plan?: string;
      subscriptionStatus?: string;
    }>();

    if (org) {
      if (hasDashboardAccess(org)) {
        redirect(afterOnboarding);
      }

      const status = String(org.subscriptionStatus ?? 'none');
      if (status === 'past_due' || status === 'canceled') {
        redirect('/dashboard/billing');
      }

      // Incomplete unpaid checkout (or other unpaid non-freemium): resume Stripe checkout.
      return (
        <OnboardingForm
          plans={plans}
          resumeMode
          organizationName={String(org.name ?? '')}
        />
      );
    }
  }

  return <OnboardingForm plans={plans} />;
}

export default async function OnboardingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <OnboardingContent redirectParam={params.redirect} />
    </Suspense>
  );
}
