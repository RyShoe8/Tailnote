import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { OrganizationModel } from '@/models/Organization';
import { EmployeeModel } from '@/models/Employee';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';
import { renderSignatureForEmployeeResolved } from '@/lib/renderEmployeeSignature';

type SessionUser = { organizationId?: string };

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
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

  const html = await renderSignatureForEmployeeResolved(org, employee, tmpl, {
    publicSiteOrigin: new URL(request.url).origin,
  });
  return NextResponse.json({ html });
}
