import '@/lib/billing-engine';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { OrganizationModel } from '@/models/Organization';
import { EmployeeModel } from '@/models/Employee';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';
import { getDefaultTemplateForOrg } from '@/lib/seedOrgTemplates';
import { findOrgTemplateWithAvailablePreset } from '@/lib/templates/validateOrgTemplate';
import { syncStripeSubscriptionSeatsForOrganization } from 'billing-engine';
import {
  assertCanAddEmployee,
  EmployeeLimitReachedError,
  getEmployeeLimitsForOrganization,
} from 'billing-engine';
import { nameFromEmail } from '@/lib/employees/nameFromEmail';
import { generateInviteToken, inviteExpiresAtFromNow } from '@/lib/employees/inviteToken';
import { sendEmployeeInvite } from '@/lib/employees/sendEmployeeInvite';

type SessionUser = { organizationId?: string };

async function requireOrg() {
  const session = await getServerSession();
  if (!session?.user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return { error: NextResponse.json({ error: 'No organization' }, { status: 400 }) };
  }
  await connectMongoose();
  const org = await OrganizationModel.findById(user.organizationId);
  if (!org) return { error: NextResponse.json({ error: 'Organization not found' }, { status: 404 }) };
  return { org, user };
}

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return NextResponse.json({ employees: [] });
  }
  await connectMongoose();
  const [employees, limits] = await Promise.all([
    EmployeeModel.find({ organizationId: user.organizationId })
      .sort({ createdAt: -1 })
      .lean(),
    getEmployeeLimitsForOrganization(user.organizationId),
  ]);
  return NextResponse.json({ employees, limits });
}

const CreateSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  title: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
  avatarUrl: z.string().optional(),
  templateId: z.string().optional(),
});

export async function POST(request: Request) {
  const ctx = await requireOrg();
  if ('error' in ctx) return ctx.error;
  const { org } = ctx;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await assertCanAddEmployee(org._id);
  } catch (e) {
    if (e instanceof EmployeeLimitReachedError) {
      return NextResponse.json(
        {
          error: e.message,
          code: e.code,
          maxEmployees: e.maxEmployees,
          currentCount: e.currentCount,
        },
        { status: 403 }
      );
    }
    throw e;
  }

  let templateId = parsed.data.templateId;
  if (!templateId) {
    const def = await getDefaultTemplateForOrg(org._id);
    if (!def) {
      return NextResponse.json({ error: 'No templates for organization' }, { status: 400 });
    }
    templateId = def._id.toString();
  } else {
    const t = await findOrgTemplateWithAvailablePreset(templateId, org._id);
    if (!t) {
      return NextResponse.json({ error: 'Invalid or unavailable template' }, { status: 400 });
    }
  }

  const previewToken = randomBytes(24).toString('hex');
  const inviteToken = generateInviteToken();
  const email = parsed.data.email.trim().toLowerCase();
  const derived = nameFromEmail(email);
  const firstName = parsed.data.firstName?.trim() || derived.firstName || 'New';
  const lastName = parsed.data.lastName?.trim() || derived.lastName || '';

  const employee = await EmployeeModel.create({
    organizationId: org._id,
    firstName,
    lastName,
    title: parsed.data.title?.trim() ?? '',
    email,
    phone: parsed.data.phone?.trim() ?? '',
    website: parsed.data.website?.trim() ?? '',
    linkedin: parsed.data.linkedin?.trim() ?? '',
    twitter: parsed.data.twitter?.trim() ?? '',
    avatarUrl: parsed.data.avatarUrl?.trim() ?? '',
    templateId,
    previewToken,
    inviteToken,
    inviteExpiresAt: inviteExpiresAtFromNow(),
  });

  void syncStripeSubscriptionSeatsForOrganization(org._id.toString()).catch(() => {});

  const inviteResult = await sendEmployeeInvite(
    {
      _id: employee._id,
      email: employee.email,
      inviteToken: employee.inviteToken,
      inviteExpiresAt: employee.inviteExpiresAt,
      inviteAcceptedAt: employee.inviteAcceptedAt,
    },
    org
  );
  if (!inviteResult.ok) {
    console.error('[employees] invite email failed', inviteResult.error);
  }

  return NextResponse.json({
    employee: employee.toObject(),
    inviteEmailSent: inviteResult.ok,
    inviteError: inviteResult.ok ? undefined : inviteResult.error,
    inviteErrorCode: inviteResult.ok ? undefined : inviteResult.code,
  });
}
