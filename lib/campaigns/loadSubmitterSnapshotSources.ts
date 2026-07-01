import mongoose from 'mongoose';
import { authUserDbFilterBySessionId } from '@/lib/auth/platformAdmin';
import { connectMongoose } from '@/lib/mongoose';
import { OrganizationModel } from '@/models/Organization';
import { UserSignatureProfileModel } from '@/models/UserSignatureProfile';
import { EmployeeModel } from '@/models/Employee';
import type { ProfileSource, AuthUserSource } from '@/lib/campaigns/resolveSubmissionSnapshot';
import type { OrganizationDoc } from '@/models/Organization';

export type SubmitterSnapshotSources = {
  authUser: AuthUserSource | null;
  org: OrganizationDoc | null;
  profile: ProfileSource | null;
  employee: ProfileSource | null;
};

function employeeToProfileSource(employee: {
  firstName?: string;
  lastName?: string;
  title?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}): ProfileSource {
  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    title: employee.title,
    email: employee.email,
    officePhone: employee.phone,
    avatarUrl: employee.avatarUrl,
  };
}

function profileDocToSource(profile: {
  firstName?: string;
  lastName?: string;
  title?: string;
  email?: string;
  officePhone?: string;
  mobilePhone?: string;
  avatarUrl?: string;
}): ProfileSource {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    title: profile.title,
    email: profile.email,
    officePhone: profile.officePhone,
    mobilePhone: profile.mobilePhone,
    avatarUrl: profile.avatarUrl,
  };
}

export async function loadSubmitterSnapshotSources(userId: string): Promise<SubmitterSnapshotSources> {
  await connectMongoose();

  const filter = authUserDbFilterBySessionId(userId);
  const db = mongoose.connection.db;
  const authUserDoc =
    filter && db
      ? await db.collection('user').findOne(filter, { projection: { email: 1, name: 1, organizationId: 1 } })
      : null;

  const authUser: AuthUserSource | null = authUserDoc
    ? {
        email: typeof authUserDoc.email === 'string' ? authUserDoc.email : undefined,
        name: typeof authUserDoc.name === 'string' ? authUserDoc.name : null,
      }
    : null;

  const rawOrgId = authUserDoc
    ? (authUserDoc as unknown as { organizationId?: unknown }).organizationId
    : undefined;
  const organizationId = typeof rawOrgId === 'string' ? rawOrgId : null;

  const [org, profileRow, employeeRow] = await Promise.all([
    organizationId ? OrganizationModel.findById(organizationId).lean() : null,
    UserSignatureProfileModel.findOne({ userId }).lean(),
    organizationId
      ? EmployeeModel.findOne({ organizationId, userId }).lean()
      : null,
  ]);

  return {
    authUser,
    org: (org as OrganizationDoc | null) ?? null,
    profile: profileRow ? profileDocToSource(profileRow as ProfileSource) : null,
    employee: employeeRow ? employeeToProfileSource(employeeRow as Parameters<typeof employeeToProfileSource>[0]) : null,
  };
}
