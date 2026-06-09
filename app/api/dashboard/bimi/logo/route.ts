import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/mongoose';
import { assertOrganizationHasBimiLogoHosting } from '@/lib/dashboard/bimiLogoRequired';
import { convertToBimiSvg } from '@/lib/bimi/convertToBimiSvg';
import { SecureImageUploadError } from '@/lib/uploads/secureImageUpload';
import { OrganizationModel, type OrganizationDoc } from '@/models/Organization';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SessionUser = { organizationId?: string; role?: string };

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }
  if (user.role !== 'owner' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectMongoose();
  const org = (await OrganizationModel.findById(user.organizationId).lean()) as OrganizationDoc | null;
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const blocked = assertOrganizationHasBimiLogoHosting(org);
  if (blocked) return blocked;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  try {
    const result = await convertToBimiSvg({
      file,
      organizationId: user.organizationId,
    });

    await OrganizationModel.updateOne(
      { _id: user.organizationId },
      {
        $set: {
          bimiLogoUrl: result.url,
          bimiSuggestedRecord: result.suggestedRecord,
          bimiLogoUploadedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      url: result.url,
      byteSize: result.byteSize,
      suggestedRecord: result.suggestedRecord,
      warnings: result.warnings,
    });
  } catch (err) {
    if (err instanceof SecureImageUploadError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logError('api/dashboard/bimi/logo', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
