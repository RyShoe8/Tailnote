import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import { getServerSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/mongoose';
import { getPublicPricingPlans } from '@/lib/billing/getPublicPricingPlans';
import { OrganizationModel } from '@/models/Organization';
import { isOrganizationPaid } from '@/lib/billing/subscriptionAccess';
import { findPendingInviteByEmail } from '@/lib/employees/findPendingInviteByEmail';

export const dynamic = 'force-dynamic';

async function OnboardingContent() {
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

  if (user.organizationId) {
    await connectMongoose();
    const org = await OrganizationModel.findById(user.organizationId);
    if (org && isOrganizationPaid(org)) {
      redirect('/dashboard');
    }
    if (org && user.role === 'owner') {
      return (
        <OnboardingForm
          plans={plans}
          resumeMode
          organizationName={String(org.name ?? org.companyName ?? '')}
        />
      );
    }
    if (org) {
      redirect('/dashboard');
    }
  }

  return <OnboardingForm plans={plans} />;
}

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-10 sm:py-12">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <OnboardingContent />
      </Suspense>
    </div>
  );
}
