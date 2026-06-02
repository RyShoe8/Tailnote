import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { isPlatformAdmin } from '@/lib/auth/platformAdmin';
import { connectMongoose } from '@/lib/mongoose';
import { OrganizationModel, type OrganizationDoc } from '@/models/Organization';

export type DashboardUser = {
  id?: string;
  email?: string;
  organizationId: string;
  role?: string;
};

export const getDashboardSession = cache(async (): Promise<{ user: DashboardUser }> => {
  const session = await getServerSession();
  if (!session?.user) {
    redirect('/login');
  }
  const raw = session.user as {
    id?: string;
    email?: string;
    organizationId?: string;
    role?: string;
  };
  if (!raw.organizationId) {
    redirect('/onboarding');
  }
  return {
    user: {
      id: raw.id,
      email: raw.email,
      organizationId: raw.organizationId,
      role: raw.role,
    },
  };
});

export const getDashboardOrg = cache(async (organizationId: string): Promise<OrganizationDoc> => {
  await connectMongoose();
  const org = await OrganizationModel.findById(organizationId).lean<OrganizationDoc>();
  if (!org) {
    redirect('/onboarding');
  }
  return org;
});

export const getShowPlatformAdmin = cache(async (userId: string) => {
  if (!userId.trim()) return false;
  return isPlatformAdmin(userId);
});

/** Layout shell: session, org existence, and platform-admin flag (parallel). */
export const getDashboardLayoutContext = cache(async () => {
  const { user } = await getDashboardSession();
  const [, showPlatformAdmin] = await Promise.all([
    getDashboardOrg(user.organizationId),
    user.id ? getShowPlatformAdmin(user.id) : Promise.resolve(false),
  ]);
  return { user, showPlatformAdmin };
});
