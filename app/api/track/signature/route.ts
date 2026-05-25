import { NextResponse } from 'next/server';
import { isOrganizationPaid } from 'billing-engine';
import { connectMongoose } from '@/lib/mongoose';
import { OrganizationModel } from '@/models/Organization';
import { verifySignatureTrackingToken, isAllowedTrackingDestination } from '@/lib/signatureTrackingToken';
import { getSignatureTrackingSecret } from '@/lib/signatureTrackingSecret';
import { SignatureClickEventModel } from '@/models/SignatureClickEvent';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const t = url.searchParams.get('t');
  const fallback = new URL('/', url.origin).toString();

  if (!t) {
    return NextResponse.redirect(fallback, 302);
  }

  const secret = getSignatureTrackingSecret();
  if (!secret) {
    return NextResponse.redirect(fallback, 302);
  }

  const payload = verifySignatureTrackingToken(t, secret);
  if (!payload || !isAllowedTrackingDestination(payload.d)) {
    return NextResponse.redirect(fallback, 302);
  }

  await connectMongoose();
  const org = await OrganizationModel.findById(payload.oid)
    .select('subscriptionStatus')
    .lean<{ subscriptionStatus?: string }>();
  if (!isOrganizationPaid(org)) {
    const billingUrl = new URL('/dashboard/billing', url.origin).toString();
    return NextResponse.redirect(billingUrl, 302);
  }

  try {
    await SignatureClickEventModel.create({
      organizationId: new mongoose.Types.ObjectId(payload.oid),
      employeeId: payload.eid ? new mongoose.Types.ObjectId(payload.eid) : undefined,
      kind: payload.k,
      userAgent: request.headers.get('user-agent')?.slice(0, 500) || '',
      referer: request.headers.get('referer')?.slice(0, 500) || '',
    });
  } catch {
    // Still redirect so recipients are not stranded when analytics write fails.
  }

  return NextResponse.redirect(payload.d, 302);
}
