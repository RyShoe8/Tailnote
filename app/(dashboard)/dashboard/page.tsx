import { Suspense } from 'react';import { hasBrandingRemoval } from 'billing-engine/subscriptionAccess';
import { OverviewOrganizationCard } from '@/components/dashboard/OverviewOrganizationCard';
import { OverviewAnalyticsSection } from '@/components/dashboard/OverviewAnalyticsSection';
import { OverviewAnalyticsSkeleton } from '@/components/dashboard/DashboardPageSkeleton';
import { getDashboardOrg, getDashboardSession } from '@/lib/dashboard/getDashboardContext';

export default async function DashboardHomePage() {
  const { user } = await getDashboardSession();
  const orgDoc = await getDashboardOrg(user.organizationId);

  const canEdit = user.role === 'owner' || user.role === 'admin';
  const trackingOn = orgDoc.signatureClickTrackingEnabled !== false;
  const openTrackingOn = orgDoc.signatureOpenTrackingEnabled === true;
  const freePlan = !hasBrandingRemoval(orgDoc);

  return (
    <div className="mx-auto min-w-0 max-w-3xl space-y-8">
      <Suspense fallback={<OverviewAnalyticsSkeleton />}>
        <OverviewAnalyticsSection
          organizationId={user.organizationId}
          userId={user.id}
          role={user.role}
          signatureOpenTrackingEnabled={openTrackingOn}
          plan={orgDoc.plan}
          subscriptionStatus={orgDoc.subscriptionStatus}
        />
      </Suspense>

      <OverviewOrganizationCard
        organizationId={orgDoc._id.toString()}
        initialName={String(orgDoc.name ?? '')}
        initialSignatureClickTrackingEnabled={trackingOn}
        initialSignatureOpenTrackingEnabled={openTrackingOn}
        initialUtmEnabled={orgDoc.utmEnabled !== false}
        canEdit={canEdit}
      />
      {freePlan ? (
        <p className="text-xs text-muted-foreground">
          Free plan active: signatures include Powered by Tailnote attribution.
        </p>
      ) : null}
    </div>
  );
}
