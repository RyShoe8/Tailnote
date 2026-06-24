import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { OrganizationModel } from '@/models/Organization';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';
import { UserSignatureProfileModel } from '@/models/UserSignatureProfile';
import { EmployeeModel } from '@/models/Employee';
import { renderAppleMailInstallerForMe } from '@/lib/appleMail/renderInstallSignatureHtml';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  templateId: z.string().min(1),
});

type SessionUser = { id?: string; organizationId?: string };

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
  }

  await connectMongoose();
  const org = await OrganizationModel.findById(user.organizationId);
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const tmpl = await SignatureTemplateModel.findOne({
    _id: parsed.data.templateId,
    organizationId: org._id,
  });
  if (!tmpl) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const profile = await UserSignatureProfileModel.findOne({ userId: user.id });
  if (!profile) {
    return NextResponse.json(
      { error: 'Save your signature details before generating an Apple Mail installer.' },
      { status: 400 }
    );
  }

  if (!profile.firstName?.trim() || !profile.lastName?.trim() || !profile.email?.trim()) {
    return NextResponse.json(
      { error: 'First name, last name, and email are required.' },
      { status: 400 }
    );
  }

  const selfEmp = await EmployeeModel.findOne({
    organizationId: org._id,
    userId: user.id,
  });

  const bundle = await renderAppleMailInstallerForMe({
    org,
    template: tmpl,
    profile,
    employeeDoc: selfEmp,
    publicSiteOrigin: new URL(request.url).origin,
  });

  return new NextResponse(bundle.content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${bundle.filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
