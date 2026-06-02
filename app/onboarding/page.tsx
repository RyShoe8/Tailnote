import '@/lib/billing-engine';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import { getServerSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/mongoose';
import { getPublicPricingPlans } from 'billing-engine';
import { OrganizationModel } from '@/models/Organization';
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
    if (org) {
      redirect('/dashboard');
    }
  }

  return <OnboardingForm plans={plans} />;
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
