import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { OrganizationModel } from '@/models/Organization';

type SessionUser = {
  organizationId?: string;
  role?: string;
};

export async function requireOrgAdmin() {
  const session = await getServerSession();
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return { error: NextResponse.json({ error: 'No organization' }, { status: 400 }) };
  }
  if (user.role !== 'owner' && user.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  await connectMongoose();
  const org = await OrganizationModel.findById(user.organizationId);
  if (!org) {
    return { error: NextResponse.json({ error: 'Organization not found' }, { status: 404 }) };
  }
  return { org, user };
}
