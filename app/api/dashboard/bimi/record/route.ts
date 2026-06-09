import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/mongoose';
import { buildBimiSuggestedRecord } from '@/lib/brandTrust/domainFromOrg';
import { OrganizationModel, type OrganizationDoc } from '@/models/Organization';

export const dynamic = 'force-dynamic';

type SessionUser = { organizationId?: string };

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return NextResponse.json({ suggestedRecord: null, url: null });
  }

  await connectMongoose();
  const org = (await OrganizationModel.findById(user.organizationId).lean()) as OrganizationDoc | null;
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const url = org.bimiLogoUrl?.trim() || null;
  const suggestedRecord =
    org.bimiSuggestedRecord?.trim() || (url ? buildBimiSuggestedRecord(url) : null);

  return NextResponse.json({ url, suggestedRecord });
}
