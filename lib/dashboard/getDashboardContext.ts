import { cache } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { loginRedirectPath } from '@/lib/auth/redirectToLogin';
import { sanitizeInternalRedirect } from '@/lib/auth/sanitizeInternalRedirect';
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
    const headersList = await headers();
    redirect(loginRedirectPath(headersList.get('x-pathname')));
  }
  const raw = session.user as {
    id?: string;
    email?: string;
    organizationId?: string;
    role?: string;
  };
  if (!raw.organizationId) {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname');
    if (pathname?.startsWith('/dashboard')) {
      const safe = sanitizeInternalRedirect(pathname);
      if (safe) {
        redirect(`/onboarding?redirect=${encodeURIComponent(safe)}`);
      }
    }
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
