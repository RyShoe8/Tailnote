import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongoose';
import { EmployeeModel, type EmployeeDoc } from '@/models/Employee';
import { OrganizationModel } from '@/models/Organization';
import { isOrganizationPaid } from '@/lib/billing/subscriptionAccess';
import { buildVcardFromEmployee, vcardFilenameForEmployee } from '@/lib/vcard/buildVcardFromEmployee';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const previewToken = token?.trim();
  if (!previewToken) {
    return new NextResponse('Not found', { status: 404 });
  }

  await connectMongoose();
  const employee = await EmployeeModel.findOne({ previewToken }).lean<EmployeeDoc | null>();
  if (!employee) {
    return new NextResponse('Not found', { status: 404 });
  }

  const org = await OrganizationModel.findById(employee.organizationId).lean<{
    subscriptionStatus?: string;
  } | null>();
  if (!org || !isOrganizationPaid(org)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const body = buildVcardFromEmployee(employee, org as never);
  const filename = vcardFilenameForEmployee(employee);

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
