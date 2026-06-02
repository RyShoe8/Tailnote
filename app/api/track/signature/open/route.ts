import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { isOrganizationPaid } from 'billing-engine';
import { hasAnalytics } from 'billing-engine';
import { connectMongoose } from '@/lib/mongoose';
import { OrganizationModel } from '@/models/Organization';
import { SignatureOpenEventModel } from '@/models/SignatureOpenEvent';
import { TRANSPARENT_TRACKING_GIF } from '@/lib/signatureOpenPixel';
import { verifySignatureOpenToken } from '@/lib/signatureOpenToken';
import { getSignatureTrackingSecret } from '@/lib/signatureTrackingSecret';

export const dynamic = 'force-dynamic';

function pixelResponse(): NextResponse {
  return new NextResponse(TRANSPARENT_TRACKING_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(TRANSPARENT_TRACKING_GIF.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      Pragma: 'no-cache',
    },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const t = url.searchParams.get('t');

  if (!t) {
    return pixelResponse();
  }

  const secret = getSignatureTrackingSecret();
  if (!secret) {
    return pixelResponse();
  }

  const payload = verifySignatureOpenToken(t, secret);
  if (!payload) {
    return pixelResponse();
  }

  await connectMongoose();
  const org = await OrganizationModel.findById(payload.oid)
    .select('plan subscriptionStatus signatureOpenTrackingEnabled')
    .lean<{ plan?: string; subscriptionStatus?: string; signatureOpenTrackingEnabled?: boolean }>();
  if (!org || !hasAnalytics(org) || !isOrganizationPaid(org) || !org.signatureOpenTrackingEnabled) {
    return pixelResponse();
  }

  try {
    await SignatureOpenEventModel.create({
      organizationId: new mongoose.Types.ObjectId(payload.oid),
      employeeId: payload.eid ? new mongoose.Types.ObjectId(payload.eid) : undefined,
      userAgent: request.headers.get('user-agent')?.slice(0, 500) || '',
      referer: request.headers.get('referer')?.slice(0, 500) || '',
    });
  } catch {
    // Always return pixel so mail clients are not broken.
  }

  return pixelResponse();
}
