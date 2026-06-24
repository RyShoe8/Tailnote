import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { OrganizationModel } from '@/models/Organization';
import { EmployeeModel } from '@/models/Employee';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';
import { renderAppleMailInstallerForEmployee } from '@/lib/appleMail/renderInstallSignatureHtml';

type SessionUser = { organizationId?: string };

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }

  await connectMongoose();
  const employee = await EmployeeModel.findOne({
    _id: id,
    organizationId: user.organizationId,
  });
  if (!employee) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const org = await OrganizationModel.findById(user.organizationId);
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const tmpl = await SignatureTemplateModel.findOne({
    _id: employee.templateId,
    organizationId: org._id,
  });
  if (!tmpl) {
    return NextResponse.json({ error: 'Template missing' }, { status: 400 });
  }

  const bundle = await renderAppleMailInstallerForEmployee({
    org,
    employee,
    template: tmpl,
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
