import '@/lib/billing-engine';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import { getServerSession } from '@/lib/auth/session';
import { sanitizeInternalRedirect } from '@/lib/auth/sanitizeInternalRedirect';
import { connectMongoose } from '@/lib/mongoose';
import { getPublicPricingPlans } from 'billing-engine';
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
    const org = await OrganizationModel.findById(user.organizationId);
    if (org) {
      redirect(afterOnboarding);
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
