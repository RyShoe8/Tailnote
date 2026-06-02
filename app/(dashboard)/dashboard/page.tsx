import '@/lib/billing-engine';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import mongoose from 'mongoose';
import { getServerSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/mongoose';
import { getEmployeeLimitsForOrganization, hasAnalytics, hasBrandingRemoval } from 'billing-engine';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';
import { SignatureClickEventModel } from '@/models/SignatureClickEvent';
import { SignatureOpenEventModel } from '@/models/SignatureOpenEvent';
import { OrganizationModel } from '@/models/Organization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OverviewOrganizationCard } from '@/components/dashboard/OverviewOrganizationCard';
import { getOrgEnabledPromoBlockSlots } from '@/lib/signatureContentBlockAnalytics';
import { getEnabledPresetIds } from '@/lib/templates/getEnabledPresets';
import { resolveViewerEmployeeId } from '@/lib/analytics/resolveViewerEmployee';

function sumKinds(byKind: Record<string, number>, keys: string[]) {
  return keys.reduce((acc, k) => acc + (byKind[k] ?? 0), 0);
}

export default async function DashboardHomePage() {
  const session = await getServerSession();
  if (!session?.user) redirect('/login');
  const user = session.user as { id?: string; organizationId?: string; role?: string };
  if (!user.organizationId) {
    redirect('/onboarding');
  }
  await connectMongoose();
  const oid = new mongoose.Types.ObjectId(user.organizationId);
  const since30 = new Date(Date.now() - 30 * 86400000);

  const enabledPresetIds = await getEnabledPresetIds();
  const enabledPresetList = [...enabledPresetIds];

  const isOwnerOrAdmin = user.role === 'owner' || user.role === 'admin';
  let clickMatch: Record<string, unknown> = {
    organizationId: oid,
    createdAt: { $gte: since30 },
  };
  if (!isOwnerOrAdmin && user.id) {
    const viewerEmployeeId = await resolveViewerEmployeeId({
      organizationId: user.organizationId,
      userId: user.id,
    });
    if (viewerEmployeeId) {
      clickMatch = { ...clickMatch, employeeId: viewerEmployeeId };
    } else {
      clickMatch = { ...clickMatch, employeeId: new mongoose.Types.ObjectId() };
    }
  }

  const openMatch = { ...clickMatch };

  const [seatLimits, templates, clickAgg, openCount, orgDoc, promoSlots] = await Promise.all([
    getEmployeeLimitsForOrganization(user.organizationId),
    SignatureTemplateModel.countDocuments({
      organizationId: user.organizationId,
      presetId: { $in: enabledPresetList },
    }),
    SignatureClickEventModel.aggregate<{ _id: string; count: number }>([
      { $match: clickMatch },
      { $group: { _id: '$kind', count: { $sum: 1 } } },
    ]),
    SignatureOpenEventModel.countDocuments(openMatch),
    OrganizationModel.findById(user.organizationId),
    getOrgEnabledPromoBlockSlots(user.organizationId),
  ]);

  if (!orgDoc) {
    redirect('/onboarding');
  }

  const canEdit = user.role === 'owner' || user.role === 'admin';
  const trackingOn = orgDoc.signatureClickTrackingEnabled !== false;
  const openTrackingOn = orgDoc.signatureOpenTrackingEnabled === true;
  const analyticsEnabled = hasAnalytics(orgDoc);
  const freePlan = !hasBrandingRemoval(orgDoc);

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
  ]);
  const emailClicks = byKind.email ?? 0;

  const seatsAvailable =
    seatLimits.maxEmployees !== null
      ? Math.max(0, seatLimits.maxEmployees - seatLimits.currentCount)
      : null;

  const employeesDescription =
    seatLimits.maxEmployees !== null
      ? 'Seats used on your plan.'
      : seatLimits.includedUsers !== null && seatLimits.canAddBeyondIncluded
        ? 'Team members with a hosted preview and exportable HTML.'
        : 'People with a hosted preview and exportable HTML.';

  return (
    <div className="mx-auto min-w-0 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-muted-foreground">
          Manage signatures and billing from the navigation (sidebar on desktop, menu on mobile).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Employees</CardTitle>
            <CardDescription>{employeesDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {seatLimits.maxEmployees !== null ? (
              <p className="text-3xl font-semibold tabular-nums">
                {seatLimits.currentCount}
                <span className="text-xl font-normal text-muted-foreground">
                  {' '}
                  / {seatLimits.maxEmployees}
                </span>
              </p>
            ) : (
              <p className="text-3xl font-semibold tabular-nums">
                {seatLimits.currentCount}
                {seatLimits.includedUsers !== null && seatLimits.canAddBeyondIncluded ? (
                  <span className="text-lg font-normal text-muted-foreground"> in use</span>
                ) : null}
              </p>
            )}
            {seatsAvailable !== null ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {seatsAvailable > 0
                  ? `${seatsAvailable} seat${seatsAvailable === 1 ? '' : 's'} available`
                  : 'All seats in use'}
              </p>
            ) : seatLimits.includedUsers !== null && seatLimits.canAddBeyondIncluded ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Includes {seatLimits.includedUsers} ·{' '}
                <Link href="/dashboard/billing" className="underline underline-offset-4">
                  add more on Billing
                </Link>
              </p>
            ) : null}
            <Link
              href="/dashboard/employees"
              className="mt-2 inline-block text-sm text-muted-foreground underline underline-offset-4"
            >
              Manage
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Layout presets</CardTitle>
            <CardDescription>Signature layouts available for employees.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{templates}</p>
            <Link href="/dashboard/signature" className="text-sm text-muted-foreground underline underline-offset-4 mt-2 inline-block">
              Signature settings
            </Link>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-1">Signature activity (last 30 days)</h2>
        <p className="text-sm text-muted-foreground mb-4">
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
            <Link href="/dashboard/upgrade" className="underline underline-offset-4">
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
                {openTrackingOn
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
