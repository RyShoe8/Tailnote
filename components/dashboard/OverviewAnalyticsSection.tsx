import Link from 'next/link';
import mongoose from 'mongoose';
import { hasAnalytics } from 'billing-engine/subscriptionAccess';
import { connectMongoose } from '@/lib/mongoose';
import { SignatureClickEventModel } from '@/models/SignatureClickEvent';
import { SignatureOpenEventModel } from '@/models/SignatureOpenEvent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DASHBOARD_UPGRADE_HREF } from '@/lib/billing/upgradeLinks';
import { getOrgEnabledPromoBlockSlots } from '@/lib/signatureContentBlockAnalytics';
import { resolveViewerEmployeeId } from '@/lib/analytics/resolveViewerEmployee';

function sumKinds(byKind: Record<string, number>, keys: string[]) {
  return keys.reduce((acc, k) => acc + (byKind[k] ?? 0), 0);
}

type Props = {
  organizationId: string;
  userId?: string;
  role?: string;
  signatureOpenTrackingEnabled: boolean;
  plan?: string;
  subscriptionStatus?: string;
};

export async function OverviewAnalyticsSection({
  organizationId,
  userId,
  role,
  signatureOpenTrackingEnabled,
  plan,
  subscriptionStatus,
}: Props) {
  await connectMongoose();
  const oid = new mongoose.Types.ObjectId(organizationId);
  const since30 = new Date(Date.now() - 30 * 86400000);

  const isOwnerOrAdmin = role === 'owner' || role === 'admin';
  let clickMatch: Record<string, unknown> = {
    organizationId: oid,
    createdAt: { $gte: since30 },
  };
  if (!isOwnerOrAdmin && userId) {
    const viewerEmployeeId = await resolveViewerEmployeeId({
      organizationId,
      userId,
    });
    if (viewerEmployeeId) {
      clickMatch = { ...clickMatch, employeeId: viewerEmployeeId };
    } else {
      clickMatch = { ...clickMatch, employeeId: new mongoose.Types.ObjectId() };
    }
  }

  const openMatch = { ...clickMatch };

  const analyticsEnabled = hasAnalytics({ plan, subscriptionStatus });

  const [clickAgg, openCount, promoSlots] = await Promise.all([
    SignatureClickEventModel.aggregate<{ _id: string; count: number }>([
      { $match: clickMatch },
      { $group: { _id: '$kind', count: { $sum: 1 } } },
    ]),
    SignatureOpenEventModel.countDocuments(openMatch),
    getOrgEnabledPromoBlockSlots(organizationId),
  ]);

  const byKind: Record<string, number> = {};
  for (const row of clickAgg) {
    byKind[row._id] = row.count;
  }

  const logoClicks = byKind.logo ?? 0;
  const websiteClicks = byKind.website ?? 0;
  const phoneClicks = sumKinds(byKind, ['office_phone', 'mobile_phone']);
  const socialClicks = sumKinds(byKind, [
    'social_linkedin',
    'social_facebook',
    'social_instagram',
    'social_reddit',
    'social_discord',
    'social_bluesky',
  ]);
  const emailClicks = byKind.email ?? 0;

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold tracking-tight">Signature activity (last 30 days)</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {isOwnerOrAdmin
          ? 'Organization-wide link clicks and optional opens when recipients view tracked signatures.'
          : 'Your signature link clicks and opens when tracking is enabled.'}{' '}
        <Link href="/dashboard/analytics" className="underline underline-offset-4">
          View analytics
        </Link>
      </p>
      {!analyticsEnabled ? (
        <p className="mb-4 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          Upgrade to remove Tailnote branding and unlock analytics.{' '}
          <Link href={DASHBOARD_UPGRADE_HREF} className="underline underline-offset-4">
            Upgrade now
          </Link>
          .
        </p>
      ) : null}
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Opens</CardTitle>
            <CardDescription>
              {signatureOpenTrackingEnabled
                ? 'Email views that loaded the tracking pixel'
                : 'Enable open tracking in Organization settings below'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{openCount}</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>Logo link clicks</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{logoClicks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Website</CardTitle>
            <CardDescription>Website URL in signature</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{websiteClicks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Email</CardTitle>
            <CardDescription>mailto: link clicks</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{emailClicks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Phone</CardTitle>
            <CardDescription>Office + mobile tel: links</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{phoneClicks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Social</CardTitle>
            <CardDescription>LinkedIn, Facebook, Instagram, Reddit</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{socialClicks}</p>
          </CardContent>
        </Card>
        {promoSlots.map((slot) => (
          <Card key={slot.kind}>
            <CardHeader>
              <CardTitle>{slot.label}</CardTitle>
              <CardDescription>{slot.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{byKind[slot.kind] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
