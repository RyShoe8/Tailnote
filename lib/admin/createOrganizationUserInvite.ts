import { AUTH_USER_COLLECTION } from '@/lib/auth/platformAdmin';
import { getAppBaseUrl } from '@/lib/email/appUrl';
import { sendEmail } from '@/lib/email/mail';
import { buildOrgUserInviteEmail } from '@/lib/email/templates/orgUserInviteEmail';
import {
  generateInviteToken,
  inviteExpiresAtFromNow,
} from '@/lib/employees/inviteToken';
import { connectMongoose, getMongoDb } from '@/lib/mongoose';
import {
  OrganizationUserInviteModel,
  type OrganizationUserInviteDoc,
} from '@/models/OrganizationUserInvite';
import { OrganizationModel } from '@/models/Organization';

export type CreateOrganizationUserInviteInput = {
  organizationId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
};

export class CreateOrganizationUserInviteError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'CreateOrganizationUserInviteError';
  }
}

type AuthUserDoc = {
  email?: string;
  organizationId?: string;
  role?: string;
};

export type OrganizationUserInviteResult = {
  id: string;
  email: string;
  name: string;
  role: string;
  inviteSentAt: Date;
  inviteUrl: string;
  devLogged?: boolean;
};

export async function createOrganizationUserInvite(
  input: CreateOrganizationUserInviteInput
): Promise<OrganizationUserInviteResult> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const organizationId = input.organizationId.trim();

  if (!email) {
    throw new CreateOrganizationUserInviteError('Email is required', 400);
  }
  if (!name) {
    throw new CreateOrganizationUserInviteError('Name is required', 400);
  }

  await connectMongoose();
  const org = await OrganizationModel.findById(organizationId);
  if (!org) {
    throw new CreateOrganizationUserInviteError('Organization not found', 404);
  }

  const db = getMongoDb();
  const users = db.collection<AuthUserDoc>(AUTH_USER_COLLECTION);

  const existing = await users.findOne({ email });
  if (existing) {
    const existingOrgId = String(existing.organizationId ?? '').trim();
    if (existingOrgId && existingOrgId !== organizationId) {
      throw new CreateOrganizationUserInviteError(
        'A user with this email already belongs to another organization',
        409
      );
    }
    throw new CreateOrganizationUserInviteError('A user with this email already exists', 409);
  }

  if (input.role === 'owner') {
    const ownerExists = await users.findOne({ organizationId, role: 'owner' });
    if (ownerExists) {
      throw new CreateOrganizationUserInviteError('This organization already has an owner', 409);
    }
  }

  const pending = await OrganizationUserInviteModel.findOne({
    organizationId,
    email,
    acceptedAt: null,
  }).lean<OrganizationUserInviteDoc | null>();

  const inviteToken = generateInviteToken();
  const inviteExpiresAt = inviteExpiresAtFromNow();
  const orgName = org.companyName?.trim() || org.name?.trim() || 'your team';
  const baseUrl = getAppBaseUrl();
  const inviteUrl = `${baseUrl}/join/${inviteToken}`;

  const { subject, html, text } = buildOrgUserInviteEmail({
    orgName,
    inviteUrl,
    inviteeEmail: email,
    inviteeName: name,
  });

  const result = await sendEmail({ to: email, subject, html, text });
  if (!result.ok) {
    throw new CreateOrganizationUserInviteError(
      result.error || 'Could not send invitation email',
      result.code === 'email_not_configured' ? 503 : 502
    );
  }

  const inviteSentAt = new Date();
  let doc: OrganizationUserInviteDoc;

  if (pending) {
    const updated = await OrganizationUserInviteModel.findByIdAndUpdate(
      pending._id,
      {
        $set: {
          name,
          role: input.role,
          inviteToken,
          inviteExpiresAt,
          inviteSentAt,
        },
      },
      { new: true }
    ).lean<OrganizationUserInviteDoc | null>();
    if (!updated) {
      throw new CreateOrganizationUserInviteError('Could not update invitation', 500);
    }
    doc = updated;
  } else {
    doc = (await OrganizationUserInviteModel.create({
      organizationId,
      email,
      name,
      role: input.role,
      inviteToken,
      inviteExpiresAt,
      inviteSentAt,
    })) as OrganizationUserInviteDoc;
  }

  if (result.devLogged) {
    console.info('[Tailnote] Organization user invite URL:', inviteUrl);
  }

  return {
    id: String(doc._id),
    email,
    name,
    role: input.role,
    inviteSentAt,
    inviteUrl,
    devLogged: result.devLogged,
  };
}
