import { AUTH_USER_COLLECTION } from '@/lib/auth/platformAdmin';
import { getAuth } from '@/lib/auth/server';
import type { AdminUserRow } from '@/lib/admin/data';
import { ensureOwnerEmployee } from '@/lib/employees/ensureOwnerEmployee';
import { connectMongoose, getMongoDb } from '@/lib/mongoose';
import { OrganizationModel } from '@/models/Organization';

export type CreateOrganizationUserInput = {
  organizationId: string;
  email: string;
  name: string;
  password: string;
  role: 'owner' | 'admin' | 'member';
};

export class CreateOrganizationUserError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'CreateOrganizationUserError';
  }
}

type AuthUserDoc = {
  _id?: unknown;
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  organizationId?: string;
  platformAdmin?: boolean;
  createdAt?: Date;
};

function userIdFromDoc(doc: AuthUserDoc): string {
  return String(doc.id ?? doc._id ?? '');
}

export async function createOrganizationUser(
  input: CreateOrganizationUserInput
): Promise<AdminUserRow> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const organizationId = input.organizationId.trim();

  if (!email) {
    throw new CreateOrganizationUserError('Email is required', 400);
  }
  if (!name) {
    throw new CreateOrganizationUserError('Name is required', 400);
  }

  await connectMongoose();
  const org = await OrganizationModel.findById(organizationId);
  if (!org) {
    throw new CreateOrganizationUserError('Organization not found', 404);
  }

  const db = getMongoDb();
  const users = db.collection<AuthUserDoc>(AUTH_USER_COLLECTION);

  const existing = await users.findOne({ email });
  if (existing) {
    const existingOrgId = String(existing.organizationId ?? '').trim();
    if (existingOrgId && existingOrgId !== organizationId) {
      throw new CreateOrganizationUserError(
        'A user with this email already belongs to another organization',
        409
      );
    }
    throw new CreateOrganizationUserError('A user with this email already exists', 409);
  }

  if (input.role === 'owner') {
    const ownerExists = await users.findOne({ organizationId, role: 'owner' });
    if (ownerExists) {
      throw new CreateOrganizationUserError('This organization already has an owner', 409);
    }
  }

  const auth = await getAuth();
  try {
    await auth.api.signUpEmail({
      body: {
        email,
        name,
        password: input.password,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not create user';
    if (message.toLowerCase().includes('already')) {
      throw new CreateOrganizationUserError('A user with this email already exists', 409);
    }
    throw new CreateOrganizationUserError(message, 400);
  }

  const created = await users.findOne({ email });
  if (!created) {
    throw new CreateOrganizationUserError('User was created but could not be loaded', 500);
  }

  const userId = userIdFromDoc(created);
  await users.updateOne(
    { email },
    {
      $set: {
        organizationId,
        role: input.role,
        emailVerified: true,
      },
    }
  );

  if (input.role === 'owner') {
    await ensureOwnerEmployee(org._id, {
      id: userId,
      email,
      name,
    });
  }

  return {
    id: userId,
    email,
    name,
    role: input.role,
    platformAdmin: Boolean(created.platformAdmin),
    createdAt: created.createdAt,
  };
}
